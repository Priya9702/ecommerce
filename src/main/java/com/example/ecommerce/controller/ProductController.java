package com.example.ecommerce.controller;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.service.ProductService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;
    public ProductController(ProductService productService){
        this.productService=productService;
    }
    @PostMapping
    public Product saveProduct(@RequestBody Product product){
        return productService.saveProduct(product);
    }
    @GetMapping
    public List<Product> getAllProducts(){
        return productService.getAllProducts();
    }
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id){
        return productService.getProductById(id);
    }
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id){
        productService.deleteProduct(id);
    }
}
