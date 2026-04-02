package com.pharmtech.service;

import com.pharmtech.dto.AuthRequest;
import com.pharmtech.dto.AuthResponse;
import com.pharmtech.dto.RegisterRequest;
import com.pharmtech.model.User;
import com.pharmtech.repository.UserRepository;
import com.pharmtech.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        var user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        repository.save(user);
        
        var secUser = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();
                
        var jwtToken = jwtService.generateToken(secUser);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        var user = repository.findByUsername(request.getUsername())
                .orElseThrow();
                
        var secUser = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();
                
        var jwtToken = jwtService.generateToken(secUser);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .build();
    }
}
