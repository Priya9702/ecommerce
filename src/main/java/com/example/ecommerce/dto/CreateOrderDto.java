package com.example.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateOrderDto {

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    public CreateOrderDto() {}

    public CreateOrderDto(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
}
