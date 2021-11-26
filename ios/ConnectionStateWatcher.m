//
//  ConnectionStateWatcher.m
//  ESv2
//
//  Created by Mohammad Julfikar on 25/11/2021.
//  Copyright © 2021 EasyTech International Sdn Bhd. All rights reserved.
//

#import "ConnectionStateWatcher.h"
#import <SystemConfiguration/SystemConfiguration.h>
#import <netinet/in.h>

@interface ConnectionStateWatcher () <NSURLSessionDataDelegate>

@property (nonatomic) SCNetworkReachabilityRef reachabilityRef;
@property (nullable, weak, nonatomic) id<ConnectionStateWatcherDelegate> delegate;
@property (nonatomic) SCNetworkReachabilityFlags lastFlags;
@property (nonnull, strong, nonatomic) ConnectionState *state;

@end

@implementation ConnectionStateWatcher
#pragma mark - Lifecycle

- (instancetype)initWithDelegate:(id<ConnectionStateWatcherDelegate>)delegate
{
    self = [self init];
    if (self) {
        _delegate = delegate;
        _state = [[ConnectionState alloc] init];
        _reachabilityRef = [self createReachabilityRef];
    }
    return self;
}

- (void)dealloc
{
    self.delegate = nil;

    if (self.reachabilityRef != nil) {
        SCNetworkReachabilityUnscheduleFromRunLoop(self.reachabilityRef, CFRunLoopGetMain(), kCFRunLoopCommonModes);
        CFRelease(self.reachabilityRef);
        self.reachabilityRef = nil;
    }
}

#pragma mark - Public methods

- (ConnectionState *)currentState
{
    return self.state;
}

#pragma mark - Callback

typedef void (^ConnectionStateUpdater)(SCNetworkReachabilityFlags);

static void ReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
    ConnectionStateUpdater block = (__bridge id)info;
    if (block != nil) {
        block(flags);
    }
}

static void ReachabilityContextRelease(const void *info)
{
    Block_release(info);
}

static const void *ReachabilityContextRetain(const void *info)
{
    return Block_copy(info);
}

- (void)update:(SCNetworkReachabilityFlags)flags
{
    self.lastFlags = flags;
    self.state = [[ConnectionState alloc] initWithReachabilityFlags:flags];
}

#pragma mark - Setters

- (void)setState:(ConnectionState *)state
{
    if (![state isEqualToConnectionState:_state]) {
        _state = state;

        [self updateDelegate];
    }
}

#pragma mark - Utilities

- (void)updateDelegate
{
    [self.delegate connectionStateWatcher:self didUpdateState:self.state];
}

- (SCNetworkReachabilityRef)createReachabilityRef
{
    struct sockaddr_in zeroAddress;
    bzero(&zeroAddress, sizeof(zeroAddress));
    zeroAddress.sin_len = sizeof(zeroAddress);
    zeroAddress.sin_family = AF_INET;

    SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, (const struct sockaddr *) &zeroAddress);

    __weak typeof(self) weakSelf = self;
    ConnectionStateUpdater callback = ^(SCNetworkReachabilityFlags flags) {
        __strong __typeof(weakSelf) strongSelf = weakSelf;
        if (strongSelf != nil) {
            [strongSelf update:flags];
        }
    };

    SCNetworkReachabilityContext context = {
        0,
        (__bridge void *)callback,
        ReachabilityContextRetain,
        ReachabilityContextRelease,
        NULL
    };
    SCNetworkReachabilitySetCallback(reachability, ReachabilityCallback, &context);
    SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);

    // Set the state the first time
    SCNetworkReachabilityFlags flags;
    SCNetworkReachabilityGetFlags(reachability, &flags);
    [self update:flags];

    return reachability;
}

@end
