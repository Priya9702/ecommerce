package com.example.ecommerce.service;

import com.example.ecommerce.dto.JwtAuthResponse;
import com.example.ecommerce.dto.LoginDto;
import com.example.ecommerce.dto.RegisterDto;
import com.example.ecommerce.dto.UserDto;

public interface AuthService {
    UserDto register(RegisterDto registerDto);
    JwtAuthResponse login(LoginDto loginDto);
    UserDto getCurrentUserProfile(String email);
}
