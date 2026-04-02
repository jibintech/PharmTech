package com.pharmtech.controller;

import com.pharmtech.model.Bill;
import com.pharmtech.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping
    public ResponseEntity<List<Bill>> getAllBills() {
        return ResponseEntity.ok(billingService.getAllBills());
    }

    @PostMapping
    public ResponseEntity<Bill> createBill(
            @RequestBody Bill bill,
            Authentication authentication
    ) {
        String billerUsername = authentication.getName();
        return ResponseEntity.ok(billingService.createBill(
                billerUsername, 
                bill.getCustomerName(), 
                bill.getCustomerPhone(), 
                bill.getPaymentMode(), 
                bill.getItems()
        ));
    }
}
