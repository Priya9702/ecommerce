package com.example.ecommerce.service.impl;

import com.example.ecommerce.dto.PaymentRequestDto;
import com.example.ecommerce.dto.PaymentResponseDto;
import com.example.ecommerce.service.PaymentService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class MockPaymentServiceImpl implements PaymentService {

    @Override
    public PaymentResponseDto processPayment(PaymentRequestDto requestDto) {
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new PaymentResponseDto(
                transactionId,
                requestDto.getOrderId(),
                requestDto.getAmount(),
                "SUCCESS",
                "Mock payment processed successfully for order #" + requestDto.getOrderId()
        );
    }
}
