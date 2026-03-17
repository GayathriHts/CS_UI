# Epic E & F - Frontend Component Implementation Checklist

## 📋 Frontend UI Components Required

### Epic E: Scoring Components

#### ☐ ScorecardInitializationForm
**Path**: `src/components/Scoring/ScorecardInitializationForm.tsx`

**Purpose**: Initialize a new scorecard with innings and batting order

**Props**:
```typescript
interface Props {
  matchId: string;
  onScorecardCreated: (scorecard: Scorecard) => void;
  teams: Team[];
}
```

**User Interactions**:
- [ ] Select toss winner from dropdown
- [ ] Select toss decision (Bat/Bowl)
- [ ] Select batting team
- [ ] Select bowling team
- [ ] Choose batting order (drag-and-drop or list reordering)
- [ ] Submit button
- [ ] Loading state during submission
- [ ] Error display if creation fails

**API Calls**:
```typescript
await scoringService.createScorecard(matchId, tossWonBy, tossDecision)
await scoringService.initializeInnings(scorecardId, inningsNumber, battingTeamId, bowlingTeamId, battingOrder)
```

---

#### ☐ BattingOrderDisplay
**Path**: `src/components/Scoring/BattingOrderDisplay.tsx`

**Purpose**: Show current batting order with status for each player

**Props**:
```typescript
interface Props {
  inningsId: string;
  onBatsmanChange?: (batsmanId: string) => void;
}
```

**Features**:
- [ ] Display batsmen in batting order (1, 2, 3, etc.)
- [ ] Show status for each: YetToBat, Batting, Out, DNB
- [ ] Highlight current striker with badge or color
- [ ] Show runs, balls, fours, sixes for each
- [ ] Click to view detailed batting stats
- [ ] Update stats when EditBattingStatsModal closes

**API Calls**:
```typescript
await scoringService.getBattingOrder(inningsId)
```

---

#### ☐ EditBattingStatsModal
**Path**: `src/components/Scoring/EditBattingStatsModal.tsx`

**Purpose**: Edit batting statistics for a player

**Props**:
```typescript
interface Props {
  inningsId: string;
  batsmanId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}
```

**Form Fields**:
- [ ] Runs scored (number)
- [ ] Balls faced (number)
- [ ] Fours (number)
- [ ] Sixes (number)
- [ ] Dismissal type (select: Bowled, Caught, LBW, Stumped, Retired, Run Out, etc. or None)
- [ ] Bowler ID (select, only if dismissed)
- [ ] Fielder ID (select, only if caught)
- [ ] Save button
- [ ] Cancel button

**API Calls**:
```typescript
await scoringService.updateBattingEntry(inningsId, batsmanId, stats)
```

---

#### ☐ BallRecordingPanel
**Path**: `src/components/Scoring/BallRecordingPanel.tsx`

**Purpose**: Form to record individual balls during match

**Props**:
```typescript
interface Props {
  matchId: string;
  inningsId: string;
  currentOver: number;
  onBallRecorded: (ball: BallByBallDetail) => void;
}
```

**Form Fields**:
- [ ] Over number (read-only)
- [ ] Ball number (auto-increment or manual)
- [ ] Batsman (select or autocomplete)
- [ ] Bowler (select or autocomplete)
- [ ] Runs (0-6, or more for extras)
- [ ] Extra type (select: None, Wide, NoBall, Bye, LegBye)
- [ ] Extra runs (number)
- [ ] Is wicket? (checkbox)
- [ ] Wicket type (select if wicket: Bowled, Caught, LBW, Stumped, Run Out)
- [ ] Commentary (text field)
- [ ] Record button
- [ ] Clear button

**Validations**:
- [ ] Over number and ball number must be valid
- [ ] Batsman and bowler must be selected
- [ ] Wicket type required if is wicket = true
- [ ] Extra runs > 0 if extra type selected

**API Calls**:
```typescript
await scoringService.recordBall(matchId, ball)
```

**Real-time Updates**:
- [ ] Subscribe to SignalR `match-{matchId}` group
- [ ] Listen for 'BallRecorded' events
- [ ] Refresh live score display

---

#### ☐ LiveScorecard
**Path**: `src/components/Scoring/LiveScorecard.tsx`

**Purpose**: Display live match scorecard with auto-updating stats

**Props**:
```typescript
interface Props {
  matchId: string;
  autoRefresh?: boolean;
}
```

**Display Sections**:
- [ ] Teams and toss info
- [ ] Current innings heading
- [ ] Batting team score (runs/wickets)
- [ ] Current over, balls in over
- [ ] Batsman info (name, runs, balls)
- [ ] Bowler info (name, overs, runs)
- [ ] Last ball details (runs, extra type)
- [ ] Commentary for last ball

**Features**:
- [ ] Auto-refresh every 2-3 seconds via polling or SignalR
- [ ] Update live as balls are recorded
- [ ] Show notification when wicket falls
- [ ] Show notification when over completes

**API Calls**:
```typescript
await scoringService.getScorecardSummary(matchId)
await scoringService.getBallByBall(inningsId)
```

---

#### ☐ OverCompletionSummary
**Path**: `src/components/Scoring/OverCompletionSummary.tsx`

**Purpose**: Show summary of completed over

**Props**:
```typescript
interface Props {
  inningsId: string;
  overNumber: number;
}
```

**Display**:
- [ ] Over number
- [ ] Total runs in over
- [ ] Wickets in over
- [ ] All 6 balls in over (scrollable or paginated)
- [ ] Bowler name
- [ ] Runs conceded
- [ ] Maidens or not
- [ ] Mark as complete button

**API Calls**:
```typescript
await scoringService.completeOver(inningsId, overNumber)
await scoringService.getBallByBall(inningsId)
```

---

#### ☐ ScorecardLockDialog
**Path**: `src/components/Scoring/ScorecardLockDialog.tsx`

**Purpose**: Lock scorecard and get verification code for unlock

**Props**:
```typescript
interface Props {
  scorecardId: string;
  isOpen: boolean;
  onClose: () => void;
  onLocked: () => void;
}
```

**Workflow**:
- [ ] Show confirmation message
- [ ] Button to lock scorecard
- [ ] Display generated code (if available)
- [ ] Copy code button
- [ ] Display unlock instructions
- [ ] Show "Locked" status after confirmation

**API Calls**:
```typescript
await scoringService.lockScorecard(scorecardId)
```

---

#### ☐ ScorecardUnlockDialog
**Path**: `src/components/Scoring/ScorecardUnlockDialog.tsx`

**Purpose**: Unlock scorecard with verification code

**Props**:
```typescript
interface Props {
  scorecardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}
```

**Form**:
- [ ] Input field for verification code
- [ ] Instructions text (format: ABC123-25022026)
- [ ] Unlock button
- [ ] Cancel button
- [ ] Error message if invalid code
- [ ] Success message if unlocked

**Validations**:
- [ ] Code format validation (length, format)
- [ ] Case-insensitive or format-aware
- [ ] Handle expired codes (older than 1 day)

**API Calls**:
```typescript
await scoringService.unlockScorecard(scorecardId, verificationCode)
```

---

### Epic F: Social Components

#### ☐ GlobalFeedView
**Path**: `src/components/Feed/GlobalFeedView.tsx`

**Purpose**: Display all posts in the system with infinite scroll

**Props**:
```typescript
interface Props {
  userId: string;
}
```

**Features**:
- [ ] Display all posts (paginated)
- [ ] Infinite scroll (load more when near bottom)
- [ ] Sort by most recent first
- [ ] Search posts (optional, advanced feature)
- [ ] Filter by user name (optional)
- [ ] Pull-to-refresh on mobile
- [ ] No "buddy only" filter

**Components Used**:
- [ ] FeedCard (for each post)
- [ ] Infinite scroll loader at bottom
- [ ] Empty state if no posts

**API Calls**:
```typescript
await feedService.getGlobalFeed(page, pageSize)
```

---

#### ☐ BuddyFeedView
**Path**: `src/components/Feed/BuddyFeedView.tsx`

**Purpose**: Display posts from accepted buddy connections only

**Props**:
```typescript
interface Props {
  userId: string;
}
```

**Features**:
- [ ] Display posts from buddies only
- [ ] Paginated with infinite scroll
- [ ] Most recent first
- [ ] "No buddies yet" message if applicable
- [ ] Prompt to add buddies

**API Calls**:
```typescript
await feedService.getFeed(page, pageSize)
```

---

#### ☐ CreatePostForm
**Path**: `src/components/Feed/CreatePostForm.tsx`

**Purpose**: Form to create a new post with optional media

**Props**:
```typescript
interface Props {
  userId: string;
  onPostCreated: (post: Feed) => void;
}
```

**Form Fields**:
- [ ] Text input for post content (textarea)
- [ ] Media upload button (image/video)
- [ ] Max length indicator (if applicable)
- [ ] Submit / Post button
- [ ] Cancel button
- [ ] Loading state during upload

**Features**:
- [ ] Accessible media picker
- [ ] Show selected media preview
- [ ] Remove media button
- [ ] Character counter
- [ ] Disable submit if empty
- [ ] Show success message after posting

**API Calls**:
```typescript
if (media) {
  const upload = await feedService.uploadMedia(media)
  await feedService.create(content, upload.fileUrl, upload.mediaType)
} else {
  await feedService.create(content)
}
```

---

#### ☐ FeedCard
**Path**: `src/components/Feed/FeedCard.tsx`

**Purpose**: Display individual post with engagement options

**Props**:
```typescript
interface Props {
  post: Feed;
  currentUserId: string;
  onLike?: () => void;
  onUnlike?: () => void;
  onCommentClick?: () => void;
  onDelete?: () => void;
}
```

**Display Sections**:
- [ ] User avatar and name
- [ ] Post timestamp (relative time: "2 hours ago")
- [ ] Post content / text
- [ ] Media (image or video) if available
- [ ] Like count
- [ ] Comment count
- [ ] Share count (if supported)

**Interaction Buttons**:
- [ ] Like button (filled/unfilled based on liked status)
- [ ] Comment button
- [ ] Delete button (only if owned by current user)
- [ ] Share button (optional)
- [ ] More options menu (optional, for report/hide)

**Visual Feedback**:
- [ ] Like button highlights when liked
- [ ] Disabled state while fetching
- [ ] Loading spinner on delete
- [ ] Success/error toast messages

**API Calls**:
```typescript
await feedService.like(postId)
await feedService.unlike(postId)
await feedService.delete(postId) // owner only
```

---

#### ☐ CommentSection
**Path**: `src/components/Feed/CommentSection.tsx`

**Purpose**: Display and manage comments on a post

**Props**:
```typescript
interface Props {
  postId: string;
  currentUserId: string;
}
```

**Layout**:
- [ ] Comment input field at top
- [ ] Submit / Post comment button
- [ ] List of existing comments below
- [ ] Each comment shows: avatar, name, timestamp, content
- [ ] Delete button for own comments (hover action)

**Features**:
- [ ] Load comments on component mount
- [ ] Refresh comments after new comment added
- [ ] Show "loading comments..." during fetch
- [ ] Empty state if no comments
- [ ] Paginate if many comments (optional)
- [ ] Real-time comment updates via SignalR (optional)

**API Calls**:
```typescript
await feedService.addComment(postId, commentText)
await feedService.getComments(postId)
await feedService.deleteComment(postId, commentId)
```

---

#### ☐ LikesDisplay
**Path**: `src/components/Feed/LikesDisplay.tsx`

**Purpose**: Show list of users who liked a post

**Props**:
```typescript
interface Props {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Display**:
- [ ] Modal or bottom sheet
- [ ] List of users who liked
- [ ] User avatar, name
- [ ] "Follow" button for each user (optional)
- [ ] Close button

**Features**:
- [ ] Infinite scroll for many likers
- [ ] No pagination if few likers
- [ ] Show first 3 likers inline on FeedCard

**API Calls**:
```typescript
await feedService.getLikes(postId)
```

---

#### ☐ MediaUploadWidget
**Path**: `src/components/Feed/MediaUploadWidget.tsx`

**Purpose**: Handle drag-drop file upload for media

**Props**:
```typescript
interface Props {
  onMediaSelected: (media: MediaUpload) => void;
  onError?: (error: string) => void;
  maxSize?: number; // default 50MB
}
```

**Features**:
- [ ] Drag-and-drop area
- [ ] File picker button
- [ ] Show selected file name and size
- [ ] Upload progress bar
- [ ] File type validation (image/*, video/*)
- [ ] Size validation (≤50MB)
- [ ] Error message if invalid
- [ ] Cancel upload button
- [ ] Remove file button

**UI/UX**:
- [ ] Visual feedback for drag-over
- [ ] Highlight drop zone on drag
- [ ] Show thumbnail for images
- [ ] Show video icon for videos
- [ ] Percentage progress during upload
- [ ] Success checkmark after upload

**API Calls**:
```typescript
const upload = await feedService.uploadMedia(file)
onMediaSelected(upload)
```

---

#### ☐ BoardFeedView
**Path**: `src/components/Board/BoardFeedView.tsx`

**Purpose**: Display feed posts specific to a board

**Props**:
```typescript
interface Props {
  boardId: string;
  currentUserId: string;
}
```

**Features**:
- [ ] Display board-scoped posts only
- [ ] Create post button (for board members)
- [ ] Paginated list with infinite scroll
- [ ] Most recent first
- [ ] Board members can comment/like
- [ ] Only members see the feed

**Components**:
- [ ] CreatePostForm (board-scoped)
- [ ] FeedCard (board-scoped posts)
- [ ] CommentSection (board-scoped)

**API Calls**:
```typescript
await boardService.getBoardFeeds(boardId, page)
await boardService.createBoardFeed(boardId, content, mediaUrl)
```

---

## ✅ Integration Checklist

### Setup & Configuration
- [ ] Install required dependencies (if any missing)
- [ ] Add route for each component
- [ ] Import all components in appropriate parent pages
- [ ] Add navigation links to scoring/feed pages

### Redux / State Management (if applicable)
- [ ] Create Redux slices for scoring state
- [ ] Create Redux slices for feed state
- [ ] Add async thunks for API calls
- [ ] Wire up store with components

### Styling
- [ ] Apply Tailwind CSS classes
- [ ] Add component-specific CSS if needed
- [ ] Ensure responsive design (mobile/tablet/desktop)
- [ ] Dark mode support (if applicable)

### Error Handling
- [ ] Add try-catch blocks in API calls
- [ ] Show user-friendly error messages
- [ ] Add retry logic for failed requests
- [ ] Log errors to monitoring service

### Loading States
- [ ] Show skeleton screens during loading
- [ ] Disable buttons while processing
- [ ] Show spinners for async operations
- [ ] Handle optimistic updates where appropriate

### Accessibility
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add focus management for modals
- [ ] Use semantic HTML

### Testing
- [ ] Write unit tests for components
- [ ] Write integration tests for API calls
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test user interactions

### Performance
- [ ] Implement memoization where needed
- [ ] Use React Query for caching
- [ ] Lazy load components if bundle is large
- [ ] Optimize images and media

---

## 📱 Mobile Responsiveness Checklist

- [ ] ScorecardInitializationForm works on small screens
- [ ] BattingOrderDisplay scrollable horizontally
- [ ] BallRecordingPanel form fits on mobile
- [ ] GlobalFeedView uses full screen height
- [ ] FeedCard readable on mobile (text size)
- [ ] Modal/Dialog fullscreen on mobile
- [ ] Touch-friendly button sizes (min 44x44px)
- [ ] Swipe to delete comments (optional)

---

## 🔗 Component Relationship Diagram

```
ScorecardInitializationForm → initiates match → LiveScorecard
                                                    ↓
                                          BallRecordingPanel
                                            ↓
                                          OverCompletionSummary
                                            ↓
                                          ScorecardLockDialog

CreatePostForm → create → GlobalFeedView → FeedCard → CommentSection
                                    ↓
                                  LikesDisplay
                                  
MediaUploadWidget ← used in CreatePostForm & CreateBoardFeed

BoardFeedView → Board management → similar flow as GlobalFeedView
```

---

## 📞 Dependencies & Imports Template

```typescript
// src/components/Scoring/ScorecardInitializationForm.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scoringService } from '@/services/cricketSocialService';
import { useToast } from '@/hooks/useToast'; // or similar
import { Scorecard, Team } from '@/types';

// src/components/Feed/GlobalFeedView.tsx
import { useQuery } from '@tanstack/react-query';
import { feedService } from '@/services/cricketSocialService';
import { Feed } from '@/types';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
```

---

**Status**: Ready for Development  
**Priority Order**: 
1. ScorecardInitializationForm & BallRecordingPanel (Critical path)
2. LiveScorecard & OverCompletionSummary (Live experience)
3. GlobalFeedView & CreatePostForm (Core social)
4. CommentSection & LikesDisplay (Engagement)
5. MediaUploadWidget & BoardFeedView (Advanced)
