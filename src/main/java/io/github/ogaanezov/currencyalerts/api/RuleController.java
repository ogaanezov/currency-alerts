package io.github.ogaanezov.currencyalerts.api;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.ogaanezov.currencyalerts.domain.AlertRule;
import io.github.ogaanezov.currencyalerts.domain.Currency;
import io.github.ogaanezov.currencyalerts.domain.CurrencyPair;
import io.github.ogaanezov.currencyalerts.domain.Direction;
import io.github.ogaanezov.currencyalerts.persistence.AlertRuleRepository;
import io.github.ogaanezov.currencyalerts.persistence.StoredAlertRule;

@RestController
@RequestMapping("/api/rules")
public class RuleController {

    private final AlertRuleRepository repository;

    public RuleController(AlertRuleRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<RuleResponse> findAll() {
        List<RuleResponse> rules = new ArrayList<>();
        for (StoredAlertRule stored : repository.findAll()) {
            rules.add(RuleResponse.from(stored));
        }
        return rules;
    }

    @PostMapping
    public ResponseEntity<RuleResponse> create(@RequestBody CreateRuleRequest request) {
        if (request.direction() == null) {
            throw new IllegalArgumentException("Direction must be ABOVE or BELOW");
        }
        AlertRule rule = new AlertRule(
                new CurrencyPair(new Currency(request.base()), new Currency(request.quote())),
                Direction.valueOf(request.direction()),
                request.threshold());
        long id = repository.save(rule);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(RuleResponse.from(new StoredAlertRule(id, rule, false)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        if (repository.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}