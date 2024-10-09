const mongoose = require('mongoose');
const User = require('../models/User');
const UserRelationships = require('../models/UserRelationships');

// Helper function to fetch userId by username
async function getUserIdByUsername(username) {
    console.log('Fetching userId for username:', username); // Debugging
    const user = await User.findOne({ username });
    if (!user) throw new Error(`User with username ${username} not found`);
    console.log('UserId found:', user.userId); // Debugging
    return user.userId;
}

// Follow a User or Interplanetary Player
exports.followUserOrIp = async (req, res) => {
    try {
        console.log('Request Body:', req.body); // Log the request body to ensure it has the correct data

        const { followerUsername, followingUsername, followingIpId, category, notes } = req.body;

        if (!followerUsername || (!followingUsername && !followingIpId)) {
            return res.status(400).json({ message: 'followerUsername and either followingUsername or followingIpId are required' });
        }

        console.log('Getting followerId for:', followerUsername);
        const followerId = await getUserIdByUsername(followerUsername);

        let followingId = null;
        if (followingUsername) {
            console.log('Getting followingId for:', followingUsername);
            followingId = await getUserIdByUsername(followingUsername);
        }

        const existingRelationship = await UserRelationships.findOne({
            followerId,
            ...(followingId ? { followingId } : { followingIpId })
        });

        if (existingRelationship) {
            return res.status(400).json({ message: 'You are already following or have a pending request for this entity' });
        }

        const relationshipType = followingId ? 'user' : 'ip';
        const status = 'active';

        const newRelationship = new UserRelationships({
            followerId,
            followingId,
            followingIpId,
            status,
            relationshipType,
            category,
            notes
        });

        await newRelationship.save();

        console.log('New relationship saved:', newRelationship); // Debugging

        // Increment following/followers counts for public accounts
        if (status === 'active' && followingId) {
            await User.updateOne({ userId: followerId }, { $inc: { followingCount: 1 } });
            await User.updateOne({ userId: followingId }, { $inc: { followersCount: 1 } });
        }

        res.json({ message: 'Followed successfully', relationship: newRelationship });
    } catch (error) {
        console.error('Error following entity:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Unfollow a User or IP
exports.unfollowUserOrIp = async (req, res) => {
    try {
        const { followerUsername, followingUsername, followingIpId } = req.body;

        if (!followerUsername || (!followingUsername && !followingIpId)) {
            return res.status(400).json({ message: 'followerUsername and either followingUsername or followingIpId are required' });
        }

        const followerId = await getUserIdByUsername(followerUsername);
        const followingId = followingUsername ? await getUserIdByUsername(followingUsername) : null;

        const relationship = await UserRelationships.findOneAndDelete({
            followerId,
            ...(followingId ? { followingId } : { followingIpId })
        });

        if (!relationship) {
            return res.status(404).json({ message: 'Relationship not found' });
        }

        // Decrement following/followers counts if unfollowing a user
        if (followingId) {
            await User.updateOne({ userId: followerId }, { $inc: { followingCount: -1 } });
            await User.updateOne({ userId: followingId }, { $inc: { followersCount: -1 } });
        }

        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Error unfollowing user/IP:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Block a User or IP
exports.blockUser = async (req, res) => {
    try {
        const { blockerUsername, blockedUsername, blockedIpId } = req.body;

        const blockerId = await getUserIdByUsername(blockerUsername);
        const blockedId = blockedUsername ? await getUserIdByUsername(blockedUsername) : null;

        let relationship = await UserRelationships.findOneAndUpdate(
            { followerId: blockerId, ...(blockedId ? { followingId: blockedId } : { followingIpId: blockedIpId }) },
            { status: 'blocked' },
            { new: true }
        );

        if (!relationship) {
            relationship = new UserRelationships({
                followerId: blockerId,
                followingId: blockedId,
                followingIpId: blockedIpId,
                status: 'blocked',
                relationshipType: blockedId ? 'user' : 'ip'
            });

            await relationship.save();
        }

        res.json({ message: 'User/IP blocked successfully', relationship });
    } catch (error) {
        console.error('Error blocking user/IP:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Unblock a User or IP
exports.unblockUser = async (req, res) => {
    try {
        const { blockerUsername, blockedUsername, blockedIpId } = req.body;

        const blockerId = await getUserIdByUsername(blockerUsername);
        const blockedId = blockedUsername ? await getUserIdByUsername(blockedUsername) : null;

        const relationship = await UserRelationships.findOneAndDelete({
            followerId: blockerId,
            ...(blockedId ? { followingId: blockedId } : { followingIpId: blockedIpId }),
            status: 'blocked'
        });

        if (!relationship) {
            return res.status(404).json({ message: 'Blocked relationship not found' });
        }

        res.json({ message: 'User/IP unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user/IP:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get following users
exports.getFollowing = async (req, res) => {
    try {
        const { username } = req.params;
        console.log('Fetching following for username:', username);

        const userId = await getUserIdByUsername(username);

        const followingRelationships = await UserRelationships.find({ followerId: userId, relationshipType: 'user' });

        // Manually fetch user data for each followingId
        const following = await Promise.all(
            followingRelationships.map(async (relationship) => {
                const user = await User.findOne({ userId: relationship.followingId }, 'username displayName profileImage');
                return { user, relationship };
            })
        );

        console.log('Following found:', following);
        res.json(following);
    } catch (error) {
        console.error('Error getting following:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Get followers
exports.getFollowers = async (req, res) => {
    try {
        const { username } = req.params;
        console.log('Fetching followers for username:', username);

        const userId = await getUserIdByUsername(username);

        const followerRelationships = await UserRelationships.find({ followingId: userId, relationshipType: 'user' });

        // Manually fetch user data for each followerId
        const followers = await Promise.all(
            followerRelationships.map(async (relationship) => {
                const user = await User.findOne({ userId: relationship.followerId }, 'username displayName profileImage');
                return { user, relationship };
            })
        );

        console.log('Followers found:', followers);
        res.json(followers);
    } catch (error) {
        console.error('Error getting followers:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get mutual followers between two users
exports.getMutualFollowers = async (req, res) => {
    try {
        const { username1, username2 } = req.params;
        console.log('Fetching mutual followers between:', username1, 'and', username2);

        // Get user IDs based on usernames
        const userId1 = await getUserIdByUsername(username1);
        const userId2 = await getUserIdByUsername(username2);

        // Find mutual followers: user1 follows user2 and user2 follows user1
        const mutualFollowers = await UserRelationships.find({
            followerId: userId1,
            followingId: userId2,
            status: 'active',
            relationshipType: 'user'
        });

        const mutualFollowing = await UserRelationships.find({
            followerId: userId2,
            followingId: userId1,
            status: 'active',
            relationshipType: 'user'
        });

        const isMutual = mutualFollowers.length > 0 && mutualFollowing.length > 0;

        // Fetch user data for mutual followers
        const mutualUsersData = await Promise.all(mutualFollowers.map(async (relationship) => {
            const user = await User.findOne({ userId: relationship.followerId }, 'username displayName profileImage');
            return { user, relationship };
        }));

        const mutualFollowingData = await Promise.all(mutualFollowing.map(async (relationship) => {
            const user = await User.findOne({ userId: relationship.followerId }, 'username displayName profileImage');
            return { user, relationship };
        }));

        // Combine the mutual followers and following details
        res.json({
            isMutual,
            mutualFollowers: mutualUsersData,
            mutualFollowing: mutualFollowingData
        });
    } catch (error) {
        console.error('Error finding mutual followers:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Check if a user is following another user
exports.checkFollowStatus = async (req, res) => {
    try {
        console.log('Request Body:', req.body);  // Log the request body to check its content

        const { followerUsername, followingUsername } = req.body;

        // Check if the necessary values are missing
        if (!followerUsername || !followingUsername) {
            return res.status(400).json({ message: 'followerUsername and followingUsername are required' });
        }

        console.log('Checking follow status between:', followerUsername, 'and', followingUsername); // Debugging

        // Fetch user IDs based on the provided usernames
        const followerId = await getUserIdByUsername(followerUsername);
        const followingId = await getUserIdByUsername(followingUsername);
        console.log('Checking follow status between:', followerUsername, 'and', followingUsername); // Debugging

        // Query the relationship
        const relationship = await UserRelationships.findOne({
            followerId,
            followingId,
            status: 'active'
        });

        res.json({ isFollowing: !!relationship });
    } catch (error) {
        console.error('Error checking follow status:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
