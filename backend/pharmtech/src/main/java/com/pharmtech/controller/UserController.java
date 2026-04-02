package com.pharmtech.controller;

import com.pharmtech.model.User;
import com.pharmtech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        var existing = userRepository.findById(id).orElseThrow();
        existing.setUsername(user.getUsername());
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        existing.setRole(user.getRole());
        return ResponseEntity.ok(userRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
