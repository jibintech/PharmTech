package com.pharmtech.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pharmacy_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PharmacySettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String pharmacyName;
    private String address;
    private String contactNumber;
    private String gstNumber;
    private Double taxRate;
    private String currencySymbol;
}
