package com.example.ecommerce.config;

import com.example.ecommerce.entity.Category;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.Role;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           ProductRepository productRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Seed Admin & Customer Users
        if (!userRepository.existsByEmail("admin@shopsphere.com")) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@shopsphere.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setPhone("+1 800-555-0199");
            admin.setRole(Role.ROLE_ADMIN);
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmail("user@shopsphere.com")) {
            User customer = new User();
            customer.setName("John Customer");
            customer.setEmail("user@shopsphere.com");
            customer.setPassword(passwordEncoder.encode("user123"));
            customer.setPhone("+1 800-555-0144");
            customer.setRole(Role.ROLE_CUSTOMER);
            userRepository.save(customer);
        }

        // Seed Sample Categories and Products
        if (categoryRepository.count() == 0) {
            Category electronics = categoryRepository.save(new Category(null, "Electronics", "Gadgets, smartphones, and laptops"));
            Category fashion = categoryRepository.save(new Category(null, "Fashion", "Trending apparel and luxury watches"));
            Category home = categoryRepository.save(new Category(null, "Home & Living", "Smart appliances and home decor"));

            productRepository.save(new Product(null, "ProWireless Headphones", "Active noise cancellation wireless headphones with 40h battery.", new BigDecimal("199.99"), 25, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", electronics));
            productRepository.save(new Product(null, "UltraSlim Smart Watch v2", "AMOLED display, heart rate sensor, and waterproof design.", new BigDecimal("249.50"), 15, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", electronics));
            productRepository.save(new Product(null, "Ergonomic Mechanical Keyboard", "RGB backlit mechanical keyboard with tactile switches.", new BigDecimal("119.00"), 40, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500", electronics));

            productRepository.save(new Product(null, "Classic Leather Jacket", "100% genuine vintage leather jacket for everyday style.", new BigDecimal("159.95"), 10, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500", fashion));
            productRepository.save(new Product(null, "Smart Coffee Brewer", "Programmable thermal coffee maker with smartphone app control.", new BigDecimal("89.99"), 30, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500", home));
        }
    }
}
