package com.ecotel.quanlytaisan.dao.mongo;

import com.ecotel.quanlytaisan.model.mongo.MongoDepartment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MongoDepartmentRepository extends MongoRepository<MongoDepartment, String> {
}
