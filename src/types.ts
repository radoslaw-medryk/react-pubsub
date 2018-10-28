export type Topic = string;
export type OnTopicUpdatedFunc = () => void;
export type SubscribeToTopicFunc = (consumerId: number, topic: Topic, onTopicUpdated: OnTopicUpdatedFunc) => void;
export type UnsubscribeFromTopicFunc = (consumerId: number, topic: Topic) => void;
export type SubscribeToAllTopics = (consumerId: number, onTopicUpdated: OnTopicUpdatedFunc) => void;
export type UnsubscribeFromAllTopics = (consumerId: number) => void;

export type ObservedTopics = Topic[] | "all" | "none";

export type TopicSubscription = {
    consumerId: number;
    onTopicUpdated: OnTopicUpdatedFunc;
};

export type TopicSubscriptionsMap = {
    [topic: string /* Topic */]: TopicSubscription[] | undefined;
};

export type AllTopicsSubscriptions = TopicSubscription[];

export type PubSubInnerContext<T> = {
    data: T,

    subscribeToTopic: SubscribeToTopicFunc;
    subscribeToAllTopics: SubscribeToAllTopics;
    unsubscribeFromTopic: UnsubscribeFromTopicFunc;
    unsubscribeFromAllTopics: UnsubscribeFromAllTopics;

    topicSubscriptionsMap: TopicSubscriptionsMap;
    allTopicsSubscriptions: AllTopicsSubscriptions;
};

export type CalculateChangedTopicsFunc<T> = (prev: T, next: T) => Topic[];
