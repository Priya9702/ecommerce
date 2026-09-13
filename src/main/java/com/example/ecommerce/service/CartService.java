package com.example.ecommerce.service;

import com.example.ecommerce.dto.AddToCartDto;
import com.example.ecommerce.dto.CartDto;
import com.example.ecommerce.dto.UpdateCartItemDto;

public interface CartService {
    CartDto getCartByUser(String userEmail);
    CartDto addToCart(String userEmail, AddToCartDto addToCartDto);
    CartDto updateCartItemQuantity(String userEmail, Long cartItemId, UpdateCartItemDto updateDto);
    CartDto removeFromCart(String userEmail, Long cartItemId);
    void clearCart(String userEmail);
}
