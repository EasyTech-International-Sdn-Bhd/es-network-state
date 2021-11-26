//
//  ConnectionStateWatcher.h
//  ESv2
//
//  Created by Mohammad Julfikar on 25/11/2021.
//  Copyright © 2021 EasyTech International Sdn Bhd. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ConnectionState.h"

NS_ASSUME_NONNULL_BEGIN

@class ConnectionStateWatcher;


@protocol ConnectionStateWatcherDelegate

- (void)connectionStateWatcher:(ConnectionStateWatcher *)connectionStateWatcher didUpdateState:(ConnectionState *)state;

@end

@interface ConnectionStateWatcher : NSObject

- (instancetype)initWithDelegate:(id<ConnectionStateWatcherDelegate>)delegate;
- (ConnectionState *)currentState;

@end

NS_ASSUME_NONNULL_END
