package io.github.ogaanezov.currencyalerts.access;

public class OwnerOnlyException extends RuntimeException {

    public OwnerOnlyException() {
        super("Only the owner can change rules");
    }
}
