import { Post } from '@/mocks/posts';

/**
 * Mix follower posts with recommended posts
 * Pattern: 2-3 follower posts, then 1 recommended post
 * @param posts - Array of all posts (both follower and recommended)
 * @returns Mixed array of posts
 */
export function mixFollowerAndRecommendedPosts(posts: Post[]): Post[] {
  const followerPosts = posts.filter(post => post.isFollowing === true);
  const recommendedPosts = posts.filter(post => post.isFollowing === false);

  const mixed: Post[] = [];
  let followerIndex = 0;
  let recommendedIndex = 0;

  while (followerIndex < followerPosts.length || recommendedIndex < recommendedPosts.length) {
    // Add 2-3 follower posts
    const followerCount = Math.floor(Math.random() * 2) + 2; // Random 2 or 3
    for (let i = 0; i < followerCount && followerIndex < followerPosts.length; i++) {
      mixed.push(followerPosts[followerIndex]);
      followerIndex++;
    }

    // Add 1 recommended post
    if (recommendedIndex < recommendedPosts.length) {
      mixed.push(recommendedPosts[recommendedIndex]);
      recommendedIndex++;
    }
  }

  return mixed;
}
