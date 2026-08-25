package com.ecotel.quanlytaisan.dao.mongo;

import com.ecotel.quanlytaisan.model.mongo.MongoDeviceType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MongoDeviceTypeRepository extends MongoRepository<MongoDeviceType, String> {
}
