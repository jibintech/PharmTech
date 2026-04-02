package com.pharmtech.service;

import com.pharmtech.model.Bill;
import com.pharmtech.model.BillItem;
import com.pharmtech.model.Medicine;
import com.pharmtech.model.User;
import com.pharmtech.repository.BillRepository;
import com.pharmtech.repository.MedicineRepository;
import com.pharmtech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillRepository billRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;

    @Transactional
    public Bill createBill(String billerUsername, String customerName, String customerPhone, String paymentMode, List<BillItem> items) {
        User biller = userRepository.findByUsername(billerUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Bill bill = new Bill();
        bill.setBiller(biller);
        bill.setCustomerName(customerName);
        bill.setCustomerPhone(customerPhone);
        bill.setPaymentMode(paymentMode);
        bill.setDate(LocalDateTime.now());
        
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (BillItem item : items) {
            Medicine medicine = medicineRepository.findById(item.getMedicine().getId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found with id: " + item.getMedicine().getId()));

            if (medicine.getStockQuantity() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for medicine: " + medicine.getName());
            }

            // Deduct stock
            medicine.setStockQuantity(medicine.getStockQuantity() - item.getQuantity());
            medicineRepository.save(medicine);

            // Set item price
            item.setPrice(medicine.getUnitPrice());
            item.setBill(bill);

            // Add to total
            BigDecimal itemTotal = item.getPrice().multiply(new BigDecimal(item.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);
        }

        bill.setItems(items);
        // Add 18% GST (9% CGST + 9% SGST)
        BigDecimal gstAmount = totalAmount.multiply(new BigDecimal("0.18"));
        bill.setTotalAmount(totalAmount.add(gstAmount));

        return billRepository.save(bill);
    }

    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }
}
