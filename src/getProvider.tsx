import * as React from "react";
import {
    PubSubInnerContext,
    CalculateChangedTopicsFunc,
    SubscribeToTopicFunc,
    TopicSubscription,
    SubscribeToAllTopics,
    UnsubscribeFromTopicFunc,
    UnsubscribeFromAllTopics,
    Topic,
} from "./types";

type PubSubProviderProps<T> = {
    value: T;
};

type PubSubProviderState<T> = {
    //
};

export const getProvider = <T extends any>(
    Context: React.Context<PubSubInnerContext<T>>,
    calculateChangedTopics: CalculateChangedTopicsFunc<T>
) => {
    return class PubSubProvider extends React.PureComponent<PubSubProviderProps<T>, PubSubProviderState<T>> {
        /* should be private, made public to suppress TS4094 */
        public innerContext: PubSubInnerContext<T>;

        constructor(props: PubSubProviderProps<T>) {
            super(props);

            this.innerContext = {
                data: props.value,

                subscribeToTopic: this.subscribeToTopic,
                subscribeToAllTopics: this.subscribeToAllTopics,
                unsubscribeFromTopic: this.unsubscribeFromTopic,
                unsubscribeFromAllTopics: this.unsubscribeFromAllTopics,

                topicSubscriptionsMap: {},
                allTopicsSubscriptions: [],
            };
        }

        public componentDidUpdate(prevProps: PubSubProviderProps<T>) {
            if (prevProps.value === this.props.value) {
                return;
            }

            // innerContext object is mutated, and all Consumers interested in change
            // (subscribed to changed topics) will be notified so they can rerender.
            this.innerContext.data = this.props.value;
            const changedTopics = calculateChangedTopics(prevProps.value, this.props.value);
            this.notifyTopicsChanged(changedTopics);
        }

        public render() {
            return (
                <Context.Provider value={this.innerContext}>
                    {this.props.children}
                </Context.Provider>
            );
        }

        /* should be private, made public to suppress TS4094 */
        public subscribeToTopic: SubscribeToTopicFunc = (consumerId, topic, onTopicUpdated) => {
            const { topicSubscriptionsMap } = this.innerContext;

            let topicSubscriptions = topicSubscriptionsMap[topic];
            if (!topicSubscriptions) {
                topicSubscriptions = [];
                topicSubscriptionsMap[topic] = topicSubscriptions;
            }

            const subscription: TopicSubscription = {
                consumerId: consumerId,
                onTopicUpdated: onTopicUpdated,
            };
            topicSubscriptions.push(subscription);
        }

        /* should be private, made public to suppress TS4094 */
        public subscribeToAllTopics: SubscribeToAllTopics = (consumerId, onTopicUpdated) => {
            const { allTopicsSubscriptions } = this.innerContext;

            const subscription: TopicSubscription = {
                consumerId: consumerId,
                onTopicUpdated: onTopicUpdated,
            };
            allTopicsSubscriptions.push(subscription);
        }

        /* should be private, made public to suppress TS4094 */
        public unsubscribeFromTopic: UnsubscribeFromTopicFunc = (consumerId, topic) => {
            const { topicSubscriptionsMap } = this.innerContext;

            const topicSubscriptions = topicSubscriptionsMap[topic];
            if (!topicSubscriptions) {
                throw new Error(`!topicSubscriptionsMap[${topic}]`);
            }

            for (let i = 0; i < topicSubscriptions.length; i++) {
                const subscription = topicSubscriptions[i];
                if (subscription.consumerId === consumerId) {
                    topicSubscriptions.splice(i, 1);
                    break;
                }
            }
        }

        /* should be private, made public to suppress TS4094 */
        // tslint:disable-next-line:arrow-parens
        public unsubscribeFromAllTopics: UnsubscribeFromAllTopics = (consumerId) => {
            const { allTopicsSubscriptions } = this.innerContext;

            for (let i = 0; i < allTopicsSubscriptions.length; i++) {
                const subscription = allTopicsSubscriptions[i];
                if (subscription.consumerId === consumerId) {
                    allTopicsSubscriptions.splice(i, 1);
                    break;
                }
            }
        }

        /* should be private, made public to suppress TS4094 */
        public notifyTopicsChanged = (changedTopics: Topic[]) => {
            const { topicSubscriptionsMap, allTopicsSubscriptions } = this.innerContext;

            const rerenderedConsumerIdMap: {[key: string]: boolean} = {};

            // TODO [RM]: DRY; try to minimize amount of code here.

            // TODO [RM]: allTopicsSubscriptions will be fired even if changedTopics is an empty array [],
            // TODO [RM]: That may be desired behavior, think about it and decide.
            for (const subscription of allTopicsSubscriptions) {
                if (rerenderedConsumerIdMap[subscription.consumerId]) {
                    continue;
                }

                subscription.onTopicUpdated();
                rerenderedConsumerIdMap[subscription.consumerId] = true;
            }

            for (const topic of changedTopics) {
                const topicSubscriptions = topicSubscriptionsMap[topic];
                if (!topicSubscriptions) {
                    continue;
                }

                for (const subscription of topicSubscriptions) {
                    if (rerenderedConsumerIdMap[subscription.consumerId]) {
                        continue;
                    }

                    subscription.onTopicUpdated();
                    rerenderedConsumerIdMap[subscription.consumerId] = true;
                }
            }
        }
    };
};
