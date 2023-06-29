package com.appsmith.server.featureflags.strategies;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.ff4j.core.FeatureStore;
import org.ff4j.core.FlippingExecutionContext;
import org.ff4j.strategy.AbstractFlipStrategy;
import reactor.core.publisher.Mono;

/**
 * This strategy enables a given feature for Appsmith users only. Useful when features are under development and not
 * ready for prime-time
 */
@Slf4j
public class AppsmithUserStrategy extends AbstractFlipStrategy {

    @Override
    public boolean evaluate(String featureName, FeatureStore store, FlippingExecutionContext executionContext) {
        Mono<User> userMono = (Mono<User>) executionContext.getValue(FieldName.VALIDATION_CONTEXT, true);
        return StringUtils.endsWith(userMono.block().getEmail(), "@appsmith.com");
    }
}