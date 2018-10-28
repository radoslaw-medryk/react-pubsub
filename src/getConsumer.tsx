import * as React from "react";
import { curry } from "@radoslaw-medryk/react-curry";
import { ObservedTopics, PubSubInnerContext } from "./types";

export type PubSubConsumerChildren<T> = (context: T) => React.ReactNode;

export type PubSubConsumerProps<T> = {
    observedTopics: ObservedTopics,
    children: PubSubConsumerChildren<T>,
};

export type PubSubConsumerState<T> = {
    //
};

export type PubSubInnerConsumerProps<T> = {
    innerContext: PubSubInnerContext<T>;
} & PubSubConsumerProps<T>;

export type PubSubInnerConsumerState<T> = {
    renderId: number;
};

export const getConsumer = <T extends any>(Context: React.Context<PubSubInnerContext<T>>) => {
    // tslint:disable-next-line:max-classes-per-file
    class PubSubInnerConsumer extends React.PureComponent<PubSubInnerConsumerProps<T>, PubSubInnerConsumerState<T>> {
        private static nextConsumerId: number = 0;
        private consumerId: number;

        constructor(props: PubSubInnerConsumerProps<T>) {
            super(props);

            this.consumerId = PubSubInnerConsumer.nextConsumerId++;

            this.state = {
                renderId: 0,
            };
        }

        public componentDidMount() {
            const { innerContext, observedTopics } = this.props;

            if (observedTopics === "all") {
                innerContext.subscribeToAllTopics(this.consumerId, this.onTopicUpdated);
            } else if (observedTopics === "none") {
                // subscribe to none.
            } else {
                for (const topic of observedTopics) {
                    innerContext.subscribeToTopic(this.consumerId, topic, this.onTopicUpdated);
                }
            }
        }

        public componentDidUpdate(prevProps: PubSubInnerConsumerProps<T>) {
            if (prevProps.observedTopics === this.props.observedTopics) {
                // TODO [RM]: compare array values instead of array instances?
                return;
            }

            // TODO [RM]: react to updated observedTopics; unsubscribe from old and subscribe to new.
        }

        public componentWillUnmount() {
            const { innerContext, observedTopics } = this.props;
            if (observedTopics === "all") {
                innerContext.unsubscribeFromAllTopics(this.consumerId);
            } else if (observedTopics === "none") {
                // unsubscribe from none.
            } else {
                for (const topic of observedTopics) {
                    innerContext.unsubscribeFromTopic(this.consumerId, topic);
                }
            }
        }

        public render() {
            const { innerContext, children } = this.props;

            return children(innerContext.data);
        }

        private onTopicUpdated = () => {
            this.requestRender();
        }

        private requestRender = () => {
            // Makes component rerender by changing state.
            this.setState(state => ({ renderId: state.renderId + 1 }));
        }
    }

    // tslint:disable-next-line:max-classes-per-file
    return class PubSubConsumer extends React.PureComponent<PubSubConsumerProps<T>, PubSubConsumerState<T>> {
        constructor(props: PubSubConsumerProps<T>) {
            super(props);
        }

        public render() {
            const { observedTopics, children } = this.props;

            // unstable_observedBits={1} to stop Consumer from rerendering when Context.Provider rerenders.
            // Provider will request rerender of PubSubInnerConsumer outside of observed bits mechanism.
            return (
                <Context.Consumer unstable_observedBits={1}>
                    {this.renderInner(observedTopics, children)}
                </Context.Consumer>
            );
        }

        // TODO [RM]: investigate how array here works with curry(...)
        /* should be private, made public to suppress TS4094 */
        public renderInner = curry(
            (observedTopics: ObservedTopics, children: PubSubConsumerChildren<T>) =>
            (innerContext: PubSubInnerContext<T>) => {
            return (
                <PubSubInnerConsumer
                    innerContext={innerContext}
                    observedTopics={observedTopics}
                    children={children}
                />
            );
        });
    };
};
