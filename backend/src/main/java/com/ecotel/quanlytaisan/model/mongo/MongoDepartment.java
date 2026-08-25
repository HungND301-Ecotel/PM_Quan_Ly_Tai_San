package com.ecotel.quanlytaisan.model.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "departments")
public class MongoDepartment {
    @Id
    private String id; // Maps to MongoDB _id
    
    private String code;
    
    private String name;
}
