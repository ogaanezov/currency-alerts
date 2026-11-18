package io.github.ogaanezov.currencyalerts.access;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Подключает проверку OwnerAccess ко всем адресам /api.
@Configuration
public class OwnerAccessConfig implements WebMvcConfigurer {

    private final OwnerAccess ownerAccess;

    public OwnerAccessConfig(OwnerAccess ownerAccess) {
        this.ownerAccess = ownerAccess;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(ownerAccess).addPathPatterns("/api/**");
    }
}
