package com.example.ecommerce.service;

import com.example.ecommerce.dto.CreateOrderDto;
import com.example.ecommerce.dto.OrderDto;
import com.example.ecommerce.dto.PagedResponse;
import com.example.ecommerce.dto.UpdateOrderStatusDto;

import java.util.List;

public interface OrderService {
    OrderDto placeOrder(String userEmail, CreateOrderDto createOrderDto);
    List<OrderDto> getUserOrders(String userEmail);
    OrderDto getOrderById(String userEmail, Long orderId);
    OrderDto cancelOrder(String userEmail, Long orderId);

    // Admin order operations
    PagedResponse<OrderDto> getAllOrders(int pageNo, int pageSize, String sortBy, String sortDir);
    OrderDto updateOrderStatus(Long orderId, UpdateOrderStatusDto updateDto);
}
