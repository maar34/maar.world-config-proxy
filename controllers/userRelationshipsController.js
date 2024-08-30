const User = require('../models/User');
const UserRelationships = require('../models/UserRelationships');

// Follow a User or Interplanetary Player
exports.followUserOrIp = async (req, res) => {
    try {
        const { followerId, followingId, followingIpId, category, notes } = req.body;

        if (!followerId || (!followingId && !followingIpId)) {
            return res.status(400).json({ message: 'followerId and either followingId or followingIpId are required' });
        }

        const existingRelationship = await UserRelationships.findOne({ 
            followerId, 
            ...(followingId ? { followingId } : { followingIpId }) 
        });

        if (existingRelationship) {
            return res.status(400).json({ message: 'You are already following or have a pending request for this entity' });
        }

        const relationshipType = followingId ? 'user' : 'ip';
        let status = 'active';

        if (followingId) {
            const followingUser = await User.findById(followingId);
            status = followingUser.privateAccount ? 'pending' : 'active'; // Automatically handle private accounts
        }

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

        if (newRelationship.status === 'pending') {
            // Notify the user of the pending request (assuming a notification system is in place)
            notifyUser(followingId, 'You have a new follow request from ' + followerId);
        }

        // Increment following/followers counts based on status
        if (newRelationship.status === 'active' && followingId) {
            await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
        }

        res.json({ message: 'Follow request sent', relationship: newRelationship });
    } catch (error) {
        console.error('Error following entity:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Unfollow a User or IP
exports.unfollowUserOrIp = async (req, res) => {
    try {
        const { followerId, followingId, followingIpId } = req.body;

        if (!followerId || (!followingId && !followingIpId)) {
            return res.status(400).json({ message: 'followerId and either followingId or followingIpId are required' });
        }

        const relationship = await UserRelationships.findOneAndDelete({ 
            followerId, 
            ...(followingId ? { followingId } : { followingIpId }) 
        });

        if (!relationship) {
            return res.status(404).json({ message: 'Relationship not found' });
        }

        // Decrement following/followers counts if unfollowing a user
        if (followingId) {
            await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
            await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
        }

        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Error unfollowing user/IP:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Block a User or IP
exports.blockUser = async (req, res) => {
    try {
        const { blockerId, blockedId, blockedIpId } = req.body;

        let relationship = await UserRelationships.findOneAndUpdate(
            { followerId: blockerId, ...(blockedId ? { followingId: blockedId } : { followingIpId: blockedIpId }) },
            { status: 'blocked' },
            { new: true }
        );

        if (!relationship) {
            // If no existing relationship, create a new blocked relationship
            relationship = new UserRelationships({
                followerId: blockerId,
                followingId: blockedId,
                followingIpId: blockedIpId,
                status: 'blocked',
                relationshipType: blockedId ? 'user' : 'ip'
            });

            await relationship.save();
        }

        // Decrement following/followers counts if the relationship was active
        if (relationship.status === 'active' && blockedId) {
            await User.findByIdAndUpdate(blockerId, { $inc: { followingCount: -1 } });
            await User.findByIdAndUpdate(blockedId, { $inc: { followersCount: -1 } });
        }

        res.json({ message: 'User/IP blocked successfully', relationship });
    } catch (error) {
        console.error('Error blocking user/IP:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Unblock a User or IP
exports.unblockUser = async (req, res) => {
    try {
        const { blockerId, blockedId, blockedIpId } = req.body;

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
        console.error('Error unblocking user/IP:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get followers of a user
exports.getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;

        const followers = await UserRelationships.find({ followingId: userId, relationshipType: 'user' })
            .populate('followerId', 'username displayName profileImage') // Only select certain fields from the user model
            .exec();

        res.json(followers);
    } catch (error) {
        console.error('Error getting followers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get following users for a user
exports.getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;

        const following = await UserRelationships.find({ followerId: userId, relationshipType: 'user' })
            .populate('followingId', 'username displayName profileImage') // Only select certain fields from the user model
            .exec();

        res.json(following);
    } catch (error) {
        console.error('Error getting following:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get mutual followers between two users
exports.getMutualFollowers = async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;

        const mutualFollowers = await UserRelationships.find({
            followerId: userId1,
            followingId: userId2,
            status: 'active',
            relationshipType: 'user'
        }).countDocuments();

        const mutualFollowing = await UserRelationships.find({
            followerId: userId2,
            followingId: userId1,
            status: 'active',
            relationshipType: 'user'
        }).countDocuments();

        const isMutual = mutualFollowers > 0 && mutualFollowing > 0;

        res.json({ mutualFollowers, mutualFollowing, isMutual });
    } catch (error) {
        console.error('Error finding mutual followers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
