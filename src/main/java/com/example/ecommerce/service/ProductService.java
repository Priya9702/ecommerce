package com.example.ecommerce.service;

import com.example.ecommerce.dto.PagedResponse;
import com.example.ecommerce.dto.ProductDto;

import java.math.BigDecimal;

public interface ProductService {
    ProductDto createProduct(ProductDto productDto);
    PagedResponse<ProductDto> getAllProducts(int pageNo, int pageSize, String sortBy, String sortDir, String search, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice);
    ProductDto getProductById(Long id);
    ProductDto updateProduct(Long id, ProductDto productDto);
    void deleteProduct(Long id);
}
