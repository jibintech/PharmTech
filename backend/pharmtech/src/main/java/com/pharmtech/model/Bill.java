package com.pharmtech.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biller_id", nullable = false)
    private User biller;

    private String customerName;
    private String customerPhone;
    private String paymentMode;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillItem> items;
}
