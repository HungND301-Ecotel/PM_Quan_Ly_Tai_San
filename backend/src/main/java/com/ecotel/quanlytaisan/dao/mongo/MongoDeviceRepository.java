package com.ecotel.quanlytaisan.dao.mongo;

import com.ecotel.quanlytaisan.model.mongo.MongoDevice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MongoDeviceRepository extends MongoRepository<MongoDevice, String> {
}
