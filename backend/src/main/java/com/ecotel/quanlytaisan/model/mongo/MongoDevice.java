package com.ecotel.quanlytaisan.model.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "devices")
public class MongoDevice {
    @Id
    private String id; // This maps to MongoDB _id
    
    private String code;
    
    private String name;
    
    private String vehicleNumber;
    
    private String department;
    
    private String category;
}
