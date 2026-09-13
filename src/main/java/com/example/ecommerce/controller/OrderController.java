package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ApiResponse;
import com.example.ecommerce.dto.CreateOrderDto;
import com.example.ecommerce.dto.OrderDto;
import com.example.ecommerce.dto.PagedResponse;
import com.example.ecommerce.dto.UpdateOrderStatusDto;
import com.example.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Customer Endpoints
    @PostMapping("/api/orders")
    public ResponseEntity<ApiResponse<OrderDto>> placeOrder(Authentication authentication, @Valid @RequestBody CreateOrderDto createOrderDto) {
        OrderDto order = orderService.placeOrder(authentication.getName(), createOrderDto);
        return new ResponseEntity<>(ApiResponse.success("Order placed successfully", order), HttpStatus.CREATED);
    }

    @GetMapping("/api/orders")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getUserOrders(Authentication authentication) {
        List<OrderDto> orders = orderService.getUserOrders(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Fetched user orders", orders));
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(Authentication authentication, @PathVariable Long id) {
        OrderDto order = orderService.getOrderById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/api/orders/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(Authentication authentication, @PathVariable Long id) {
        OrderDto order = orderService.cancelOrder(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", order));
    }

    // Admin Endpoints
    @GetMapping("/api/admin/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<OrderDto>>> getAllOrders(
            @RequestParam(value = "pageNo", defaultValue = "0", required = false) int pageNo,
            @RequestParam(value = "pageSize", defaultValue = "10", required = false) int pageSize,
            @RequestParam(value = "sortBy", defaultValue = "createdAt", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc", required = false) String sortDir
    ) {
        PagedResponse<OrderDto> orders = orderService.getAllOrders(pageNo, pageSize, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Fetched all system orders", orders));
    }

    @PutMapping("/api/admin/orders/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusDto updateDto) {
        OrderDto order = orderService.updateOrderStatus(id, updateDto);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", order));
    }
}
