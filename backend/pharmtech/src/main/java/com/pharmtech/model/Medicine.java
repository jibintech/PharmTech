package com.pharmtech.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "medicines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String manufacturer;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer stockQuantity;

    private LocalDate expiryDate;
}
