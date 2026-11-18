package io.github.ogaanezov.currencyalerts.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import io.github.ogaanezov.currencyalerts.access.OwnerAccess;

// Интерфейс спрашивает здесь, показывать ли форму правил и кнопки удаления.
@RestController
public class AccessController {

    public record AccessResponse(boolean canEdit) {
    }

    private final OwnerAccess ownerAccess;

    public AccessController(OwnerAccess ownerAccess) {
        this.ownerAccess = ownerAccess;
    }

    @GetMapping("/api/access")
    public AccessResponse access(@RequestHeader(name = OwnerAccess.HEADER, required = false) String token) {
        return new AccessResponse(ownerAccess.canEdit(token));
    }
}
