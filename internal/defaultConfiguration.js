export default {
    reachabilityUrl: 'https://clients3.google.com/generate_204',
    reachabilityTest: (response) => Promise.resolve(response.status === 204),
    reachabilityShortTimeout: 5 * 1000,
    reachabilityLongTimeout: 60 * 1000,
    reachabilityRequestTimeout: 15 * 1000,
    reachabilityShouldRun: () => true,
};
