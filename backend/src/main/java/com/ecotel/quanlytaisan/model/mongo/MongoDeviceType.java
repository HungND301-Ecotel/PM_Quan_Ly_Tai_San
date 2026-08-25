package com.ecotel.quanlytaisan.model.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "devicetypes")
public class MongoDeviceType {
    @Id
    private String id;
    
    private String name;
}
