package com.ecotel.quanlytaisan.service;

import com.ecotel.quanlytaisan.model.mongo.MongoDepartment;
import com.ecotel.quanlytaisan.model.mongo.MongoDevice;
import com.ecotel.quanlytaisan.model.mongo.MongoDeviceType;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.changestream.ChangeStreamDocument;
import com.mongodb.client.model.changestream.FullDocument;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Lắng nghe thay đổi real-time từ MongoDB (Change Streams)
 * và đồng bộ sang MySQL ngay lập tức.
 *
 * Yêu cầu: MongoDB phải đang chạy ở chế độ Replica Set.
 */
@Slf4j
@Service
public class MongoChangeStreamService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private DeviceSyncService deviceSyncService;

    @Autowired
    private DepartmentSyncService departmentSyncService;

    private final ExecutorService executor = Executors.newFixedThreadPool(3);
    private volatile boolean running = false;

    @PostConstruct
    public void startListening() {
        running = true;
        log.info("=== Khởi động Change Streams listeners cho MongoDB... ===");

        // Đồng bộ toàn bộ dữ liệu hiện có (departments, deviceTypes, devices)
        // trước khi bắt đầu lắng nghe thay đổi mới, để không bỏ sót data cũ.
        fullSyncAll();

        executor.submit(this::listenDepartments);
        executor.submit(this::listenDeviceTypes);
        executor.submit(this::listenDevices);
    }

    @PreDestroy
    public void stopListening() {
        running = false;
        executor.shutdownNow();
        log.info("=== Đã dừng Change Streams listeners. ===");
    }

    // ─── Full Sync (chạy 1 lần lúc khởi động) ─────────────────────────────────

    private void fullSyncAll() {
        log.info("[FullSync] Bắt đầu đồng bộ toàn bộ dữ liệu hiện có...");
        fullSyncDepartments();
        fullSyncDeviceTypes();
        fullSyncDevices();
        log.info("[FullSync] Hoàn tất đồng bộ toàn bộ dữ liệu ban đầu.");
    }

    private void fullSyncDepartments() {
        try {
            MongoCollection<Document> col = mongoTemplate.getCollection("departments");
            int count = 0;
            for (Document doc : col.find()) {
                try {
                    MongoDepartment dept = mapToDepartment(doc);
                    departmentSyncService.syncSingleDepartment(dept);
                    count++;
                } catch (Exception e) {
                    log.error("[FullSync] Lỗi đồng bộ department (_id={}): {}",
                            doc.get("_id"), e.getMessage());
                }
            }
            log.info("[FullSync] Đã đồng bộ {} department(s).", count);
        } catch (Exception e) {
            log.error("[FullSync] Lỗi khi đồng bộ toàn bộ departments: {}", e.getMessage());
        }
    }

    private void fullSyncDeviceTypes() {
        try {
            MongoCollection<Document> col = mongoTemplate.getCollection("deviceTypes");
            int count = 0;
            for (Document doc : col.find()) {
                try {
                    MongoDeviceType dt = mapToDeviceType(doc);
                    deviceSyncService.syncSingleDeviceType(dt);
                    count++;
                } catch (Exception e) {
                    log.error("[FullSync] Lỗi đồng bộ deviceType (_id={}): {}",
                            doc.get("_id"), e.getMessage());
                }
            }
            log.info("[FullSync] Đã đồng bộ {} deviceType(s).", count);
        } catch (Exception e) {
            log.error("[FullSync] Lỗi khi đồng bộ toàn bộ deviceTypes: {}", e.getMessage());
        }
    }

    private void fullSyncDevices() {
        try {
            MongoCollection<Document> col = mongoTemplate.getCollection("devices");
            int count = 0;
            for (Document doc : col.find()) {
                try {
                    MongoDevice device = mapToDevice(doc);
                    deviceSyncService.syncSingleDevice(device);
                    count++;
                } catch (Exception e) {
                    log.error("[FullSync] Lỗi đồng bộ device (_id={}): {}",
                            doc.get("_id"), e.getMessage());
                }
            }
            log.info("[FullSync] Đã đồng bộ {} device(s).", count);
        } catch (Exception e) {
            log.error("[FullSync] Lỗi khi đồng bộ toàn bộ devices: {}", e.getMessage());
        }
    }

    // ─── Departments (Change Stream) ──────────────────────────────────────────

    private void listenDepartments() {
        log.info("[ChangeStream] Bắt đầu lắng nghe collection 'departments'...");
        while (running) {
            try {
                MongoCollection<Document> col = mongoTemplate.getCollection("departments");
                try (MongoCursor<ChangeStreamDocument<Document>> cursor =
                             col.watch().fullDocument(FullDocument.UPDATE_LOOKUP).iterator()) {
                    while (running && cursor.hasNext()) {
                        ChangeStreamDocument<Document> change = cursor.next();
                        String opType = change.getOperationTypeString();
                        log.info("[ChangeStream] departments - operation: {}", opType);
                        if (change.getFullDocument() != null &&
                                (opType.equals("insert") || opType.equals("update") || opType.equals("replace"))) {
                            MongoDepartment dept = mapToDepartment(change.getFullDocument());
                            try {
                                departmentSyncService.syncSingleDepartment(dept);
                                log.info("[ChangeStream] Đồng bộ department thành công: {}", dept.getCode());
                            } catch (Exception e) {
                                log.error("[ChangeStream] Lỗi đồng bộ department: {}", e.getMessage());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                if (running) {
                    log.warn("[ChangeStream] departments watcher bị ngắt, thử lại sau 5 giây: {}", e.getMessage());
                    sleep(5000);
                }
            }
        }
    }

    // ─── DeviceTypes (Change Stream) ───────────────────────────────────────────

    private void listenDeviceTypes() {
        log.info("[ChangeStream] Bắt đầu lắng nghe collection 'deviceTypes'...");
        while (running) {
            try {
                MongoCollection<Document> col = mongoTemplate.getCollection("deviceTypes");
                try (MongoCursor<ChangeStreamDocument<Document>> cursor =
                             col.watch().fullDocument(FullDocument.UPDATE_LOOKUP).iterator()) {
                    while (running && cursor.hasNext()) {
                        ChangeStreamDocument<Document> change = cursor.next();
                        String opType = change.getOperationTypeString();
                        log.info("[ChangeStream] deviceTypes - operation: {}", opType);
                        if (change.getFullDocument() != null &&
                                (opType.equals("insert") || opType.equals("update") || opType.equals("replace"))) {
                            MongoDeviceType dt = mapToDeviceType(change.getFullDocument());
                            try {
                                deviceSyncService.syncSingleDeviceType(dt);
                                log.info("[ChangeStream] Đồng bộ deviceType thành công: {}", dt.getName());
                            } catch (Exception e) {
                                log.error("[ChangeStream] Lỗi đồng bộ deviceType: {}", e.getMessage());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                if (running) {
                    log.warn("[ChangeStream] deviceTypes watcher bị ngắt, thử lại sau 5 giây: {}", e.getMessage());
                    sleep(5000);
                }
            }
        }
    }

    // ─── Devices (Change Stream) ────────────────────────────────────────────────

    private void listenDevices() {
        log.info("[ChangeStream] Bắt đầu lắng nghe collection 'devices'...");
        while (running) {
            try {
                MongoCollection<Document> col = mongoTemplate.getCollection("devices");
                try (MongoCursor<ChangeStreamDocument<Document>> cursor =
                             col.watch().fullDocument(FullDocument.UPDATE_LOOKUP).iterator()) {
                    while (running && cursor.hasNext()) {
                        ChangeStreamDocument<Document> change = cursor.next();
                        String opType = change.getOperationTypeString();
                        log.info("[ChangeStream] devices - operation: {}", opType);
                        if (change.getFullDocument() != null &&
                                (opType.equals("insert") || opType.equals("update") || opType.equals("replace"))) {
                            MongoDevice device = mapToDevice(change.getFullDocument());
                            try {
                                deviceSyncService.syncSingleDevice(device);
                                log.info("[ChangeStream] Đồng bộ device thành công: {}", device.getCode());
                            } catch (Exception e) {
                                log.error("[ChangeStream] Lỗi đồng bộ device: {}", e.getMessage());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                if (running) {
                    log.warn("[ChangeStream] devices watcher bị ngắt, thử lại sau 5 giây: {}", e.getMessage());
                    sleep(5000);
                }
            }
        }
    }

    // ─── Mapping helpers ──────────────────────────────────────────────────────

    private MongoDepartment mapToDepartment(Document doc) {
        MongoDepartment d = new MongoDepartment();
        d.setId(doc.getObjectId("_id") != null ? doc.getObjectId("_id").toHexString() : doc.getString("_id"));
        d.setCode(doc.getString("code"));
        d.setName(doc.getString("name"));
        return d;
    }

    private MongoDeviceType mapToDeviceType(Document doc) {
        MongoDeviceType dt = new MongoDeviceType();
        dt.setId(doc.getObjectId("_id") != null ? doc.getObjectId("_id").toHexString() : doc.getString("_id"));
        dt.setName(doc.getString("name"));
        return dt;
    }

    private MongoDevice mapToDevice(Document doc) {
        MongoDevice device = new MongoDevice();
        device.setId(doc.getObjectId("_id") != null ? doc.getObjectId("_id").toHexString() : doc.getString("_id"));
        device.setCode(doc.getString("code"));
        device.setName(doc.getString("name"));
        device.setVehicleNumber(doc.getString("vehicleNumber"));
        device.setDepartment(getStringOrObjectId(doc, "department"));
        device.setCategory(getStringOrObjectId(doc, "category"));
        return device;
    }

    // Xử lý field có thể là String hoặc ObjectId (tránh ClassCastException)
    private String getStringOrObjectId(Document doc, String field) {
        Object value = doc.get(field);
        if (value == null) return null;
        if (value instanceof org.bson.types.ObjectId objectId) {
            return objectId.toHexString();
        }
        return value.toString();
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
    }
}