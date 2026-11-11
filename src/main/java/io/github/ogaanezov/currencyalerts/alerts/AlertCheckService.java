package io.github.ogaanezov.currencyalerts.alerts;

import java.time.Instant;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.github.ogaanezov.currencyalerts.domain.ExchangeRate;
import io.github.ogaanezov.currencyalerts.domain.Notification;
import io.github.ogaanezov.currencyalerts.persistence.AlertRuleRepository;
import io.github.ogaanezov.currencyalerts.persistence.ExchangeRateRepository;
import io.github.ogaanezov.currencyalerts.persistence.NotificationRepository;
import io.github.ogaanezov.currencyalerts.persistence.StoredAlertRule;

@Service
public class AlertCheckService {

    private static final Logger log = LoggerFactory.getLogger(AlertCheckService.class);

    private final AlertRuleRepository ruleRepository;
    private final ExchangeRateRepository rateRepository;
    private final NotificationRepository notificationRepository;

    public AlertCheckService(
            AlertRuleRepository ruleRepository,
            ExchangeRateRepository rateRepository,
            NotificationRepository notificationRepository) {
        this.ruleRepository = ruleRepository;
        this.rateRepository = rateRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public int checkRules(Instant now) {
        int notificationCount = 0;
        for (StoredAlertRule stored : ruleRepository.findAll()) {
            Optional<ExchangeRate> latestRate = rateRepository.findLatest(stored.rule().pair());
            if (latestRate.isEmpty()) {
                continue;
            }

            boolean triggeredNow = stored.rule().isTriggeredBy(latestRate.get().rate());
            if (triggeredNow && !stored.triggered()) {
                notificationRepository.save(stored.id(), new Notification(stored.rule(), latestRate.get().rate(), now));
                notificationCount++;
                log.info("Rule {} crossed its threshold at rate {}", stored.id(), latestRate.get().rate());
            }
            if (triggeredNow != stored.triggered()) {
                ruleRepository.updateTriggered(stored.id(), triggeredNow);
            }
        }
        return notificationCount;
    }
}