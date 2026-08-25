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

    // ─── Departments ──────────────────────────────────────────────────────────

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

    // ─── DeviceTypes ──────────────────────────────────────────────────────────

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

    // ─── Devices ──────────────────────────────────────────────────────────────

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
        device.setDepartment(doc.getString("department"));
        device.setCategory(doc.getString("category"));
        return device;
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
    }
}
