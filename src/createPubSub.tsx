import * as React from "react";
import { getProvider } from "./getProvider";
import { getConsumer } from "./getConsumer";
import { PubSubInnerContext, CalculateChangedTopicsFunc } from "./types";

export const createPubSub = <T extends any>(defaultValue: T, calculateChangedTopics: CalculateChangedTopicsFunc<T>) => {
    const defaultInnerContext: PubSubInnerContext<T> = {
        data: defaultValue,

        subscribeToTopic: () => null,
        subscribeToAllTopics: () => null,
        unsubscribeFromTopic: () => null,
        unsubscribeFromAllTopics: () => null,

        topicSubscriptionsMap: {},
        allTopicsSubscriptions: [],
    };

    // Prevents Consumers that observe any bit from rerendering.
    // We will request them to rerender outside of observed bits mechanism.
    const calculateChangedBits = () => 0;

    const Context = React.createContext<PubSubInnerContext<T>>(defaultInnerContext, calculateChangedBits);
    return {
        Provider: getProvider(Context, calculateChangedTopics),
        Consumer: getConsumer(Context),
    };
};
