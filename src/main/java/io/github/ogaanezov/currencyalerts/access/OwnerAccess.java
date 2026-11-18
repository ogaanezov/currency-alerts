package io.github.ogaanezov.currencyalerts.access;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Решает, может ли запрос что-то менять. Ключ владельца берётся из ADMIN_TOKEN.
// Если ключ не задан (локальная разработка), менять может любой, как раньше.
// Работает как перехватчик: проверяет каждый запрос к /api до контроллера.
@Component
public class OwnerAccess implements HandlerInterceptor {

    public static final String HEADER = "X-Admin-Token";

    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final byte[] ownerToken;

    public OwnerAccess(@Value("${app.admin-token:}") String ownerToken) {
        this.ownerToken = ownerToken.getBytes(StandardCharsets.UTF_8);
    }

    public boolean canEdit(String givenToken) {
        if (ownerToken.length == 0) {
            return true;
        }
        if (givenToken == null) {
            return false;
        }
        // Сравнение за одинаковое время, чтобы ключ нельзя было подобрать по скорости ответа.
        return MessageDigest.isEqual(ownerToken, givenToken.getBytes(StandardCharsets.UTF_8));
    }

    // Читать можно всем, а POST, PUT, DELETE и другие изменения — только с ключом владельца.
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!READ_METHODS.contains(request.getMethod()) && !canEdit(request.getHeader(HEADER))) {
            throw new OwnerOnlyException();
        }
        return true;
    }
}
