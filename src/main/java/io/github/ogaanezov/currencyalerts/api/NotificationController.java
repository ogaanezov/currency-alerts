package io.github.ogaanezov.currencyalerts.api;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.ogaanezov.currencyalerts.persistence.NotificationRepository;
import io.github.ogaanezov.currencyalerts.persistence.StoredNotification;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<NotificationResponse> findAll() {
        List<NotificationResponse> notifications = new ArrayList<>();
        for (StoredNotification stored : repository.findAll()) {
            notifications.add(NotificationResponse.from(stored));
        }
        return notifications;
    }
}