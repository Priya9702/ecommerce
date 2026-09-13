package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AddToCartDto;
import com.example.ecommerce.dto.ApiResponse;
import com.example.ecommerce.dto.CartDto;
import com.example.ecommerce.dto.UpdateCartItemDto;
import com.example.ecommerce.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartDto>> getCart(Authentication authentication) {
        CartDto cart = cartService.getCartByUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Fetched shopping cart", cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDto>> addToCart(Authentication authentication, @Valid @RequestBody AddToCartDto addToCartDto) {
        CartDto cart = cartService.addToCart(authentication.getName(), addToCartDto);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cart));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDto>> updateCartItemQuantity(Authentication authentication, @PathVariable Long itemId, @Valid @RequestBody UpdateCartItemDto updateDto) {
        CartDto cart = cartService.updateCartItemQuantity(authentication.getName(), itemId, updateDto);
        return ResponseEntity.ok(ApiResponse.success("Cart item quantity updated", cart));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartDto>> removeFromCart(Authentication authentication, @PathVariable Long itemId) {
        CartDto cart = cartService.removeFromCart(authentication.getName(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Shopping cart cleared", null));
    }
}
