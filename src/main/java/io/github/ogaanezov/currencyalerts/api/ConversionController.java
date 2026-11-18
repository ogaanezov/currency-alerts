package io.github.ogaanezov.currencyalerts.api;

import java.math.BigDecimal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.github.ogaanezov.currencyalerts.conversion.ConversionService;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;

@RestController
@RequestMapping("/api/convert")
public class ConversionController {

    private final ConversionService service;

    public ConversionController(ConversionService service) {
        this.service = service;
    }

    @GetMapping
    public ConversionResponse convert(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam BigDecimal amount) {
        CurrencyPair pair = new CurrencyPair(new Currency(from), new Currency(to));
        return ConversionResponse.from(service.convert(pair, amount));
    }
}