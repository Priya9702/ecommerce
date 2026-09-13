package com.example.ecommerce.service.impl;

import com.example.ecommerce.dto.AddToCartDto;
import com.example.ecommerce.dto.CartDto;
import com.example.ecommerce.dto.CartItemDto;
import com.example.ecommerce.dto.UpdateCartItemDto;
import com.example.ecommerce.entity.Cart;
import com.example.ecommerce.entity.CartItem;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.BadRequestException;
import com.example.ecommerce.exception.InsufficientStockException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CartItemRepository;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public CartDto getCartByUser(String userEmail) {
        Cart cart = getOrCreateCart(userEmail);
        return mapToDto(cart);
    }

    @Override
    @Transactional
    public CartDto addToCart(String userEmail, AddToCartDto addToCartDto) {
        Cart cart = getOrCreateCart(userEmail);

        Product product = productRepository.findById(addToCartDto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", addToCartDto.getProductId()));

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        int newTotalQuantity = addToCartDto.getQuantity();
        if (existingItemOpt.isPresent()) {
            newTotalQuantity += existingItemOpt.get().getQuantity();
        }

        if (newTotalQuantity > product.getQuantity()) {
            throw new InsufficientStockException("Cannot add " + addToCartDto.getQuantity() + " item(s). Available stock: " + product.getQuantity());
        }

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.updateQuantity(newTotalQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem(cart, product, addToCartDto.getQuantity(), product.getPrice());
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        cart.recalculateTotal();
        Cart savedCart = cartRepository.save(cart);
        return mapToDto(savedCart);
    }

    @Override
    @Transactional
    public CartDto updateCartItemQuantity(String userEmail, Long cartItemId, UpdateCartItemDto updateDto) {
        Cart cart = getOrCreateCart(userEmail);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to user's cart");
        }

        Product product = cartItem.getProduct();
        if (updateDto.getQuantity() > product.getQuantity()) {
            throw new InsufficientStockException("Requested quantity " + updateDto.getQuantity() + " exceeds available stock (" + product.getQuantity() + ")");
        }

        cartItem.updateQuantity(updateDto.getQuantity());
        cartItemRepository.save(cartItem);

        cart.recalculateTotal();
        Cart savedCart = cartRepository.save(cart);
        return mapToDto(savedCart);
    }

    @Override
    @Transactional
    public CartDto removeFromCart(String userEmail, Long cartItemId) {
        Cart cart = getOrCreateCart(userEmail);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to user's cart");
        }

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        cart.recalculateTotal();
        Cart savedCart = cartRepository.save(cart);
        return mapToDto(savedCart);
    }

    @Override
    @Transactional
    public void clearCart(String userEmail) {
        Cart cart = getOrCreateCart(userEmail);
        cart.getItems().clear();
        cart.recalculateTotal();
        cartRepository.save(cart);
    }

    private Cart getOrCreateCart(String userEmail) {
        return cartRepository.findByUserEmail(userEmail)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(userEmail)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
                    Cart newCart = new Cart(user);
                    return cartRepository.save(newCart);
                });
    }

    private CartDto mapToDto(Cart cart) {
        cart.recalculateTotal();
        return new CartDto(
                cart.getId(),
                cart.getUser().getId(),
                cart.getItems().stream().map(item -> new CartItemDto(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getImageUrl(),
                        item.getPrice(),
                        item.getQuantity(),
                        item.getSubtotal()
                )).collect(Collectors.toList()),
                cart.getTotalAmount()
        );
    }
}
