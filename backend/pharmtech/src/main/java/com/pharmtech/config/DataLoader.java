package com.pharmtech.config;

import com.pharmtech.model.Medicine;
import com.pharmtech.model.Role;
import com.pharmtech.model.User;
import com.pharmtech.repository.MedicineRepository;
import com.pharmtech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initial Users
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();

            User biller = User.builder()
                    .username("biller")
                    .password(passwordEncoder.encode("biller123"))
                    .role(Role.BILLER)
                    .build();

            userRepository.saveAll(Arrays.asList(admin, biller));
            System.out.println("Default users created: admin/admin123, biller/biller123");
        }

        // Initial Medicines
        if (medicineRepository.count() < 10) {
            java.util.List<Medicine> newMeds = new java.util.ArrayList<>();
            
            addIfMissing(newMeds, "Paracetamol 500mg", "GSK India", "15.50", 100, 12);
            addIfMissing(newMeds, "Amoxicillin 250mg", "Pfizer Ltd", "120.00", 50, 6);
            addIfMissing(newMeds, "Aspirin 100mg", "Bayer India", "8.25", 200, 24);
            addIfMissing(newMeds, "Crocin Advance 650mg", "GSK", "30.00", 150, 12);
            addIfMissing(newMeds, "Pantocid 40mg", "Sun Pharma", "12.50", 80, 12);
            addIfMissing(newMeds, "Azithral 500mg", "Alembic", "75.00", 40, 8);
            addIfMissing(newMeds, "Metformin 500mg", "USV", "5.50", 300, 36);
            addIfMissing(newMeds, "Okacet (Cetirizine)", "Cipla", "1.80", 500, 24);
            addIfMissing(newMeds, "Dolo 650", "Micro Labs", "2.00", 400, 12);
            addIfMissing(newMeds, "Vicks Action 500", "P&G", "5.00", 120, 12);

            if (!newMeds.isEmpty()) {
                medicineRepository.saveAll(newMeds);
                System.out.println(newMeds.size() + " new medicines seeded.");
            }
        }
    }

    private void addIfMissing(java.util.List<Medicine> list, String name, String mfg, String price, int qty, int months) {
        if (!medicineRepository.existsByName(name)) {
            list.add(Medicine.builder()
                    .name(name)
                    .manufacturer(mfg)
                    .unitPrice(new BigDecimal(price))
                    .stockQuantity(qty)
                    .expiryDate(LocalDate.now().plusMonths(months))
                    .build());
        }
    }
}
