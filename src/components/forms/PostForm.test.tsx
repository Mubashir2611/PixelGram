import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import PostForm from './PostForm';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockCreatePost = vi.fn();
const mockUpdatePost = vi.fn(); // Though not strictly needed for these tests, good practice to mock all hooks used by the component

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/lib/react-query/queries', () => ({
  useCreatePost: () => ({ mutateAsync: mockCreatePost, isLoading: false }),
  useUpdatePost: () => ({ mutateAsync: mockUpdatePost, isLoading: false }),
}));

vi.mock('@/context/AuthContext', () => ({
  useUserContext: () => ({ user: { id: 'test-user-id' } }),
}));

describe('PostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPostForm = (action: "Create" | "Update" = "Create", post?: any) => {
    return render(
      <BrowserRouter>
        <PostForm action={action} post={post} />
      </BrowserRouter>
    );
  };

  it('should not redirect if post creation fails', async () => {
    // Arrange
    mockCreatePost.mockResolvedValue(null); // Simulate failed post creation
    renderPostForm("Create");

    // Act
    fireEvent.change(screen.getByLabelText(/caption/i), { target: { value: 'Test Caption' } });
    // Assuming FileUploader and other fields are handled or not mandatory for this specific test's logic regarding redirection.
    // If specific fields are mandatory for submission beyond caption, they would need to be filled.
    fireEvent.submit(screen.getByRole('button', { name: /create post/i }));

    // Assert
    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });
    expect(mockToast).toHaveBeenCalledWith({ title: 'Create post failed. Please try again.' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect to home if post creation succeeds', async () => {
    // Arrange
    mockCreatePost.mockResolvedValue({ $id: 'new-post-id' }); // Simulate successful post creation
    renderPostForm("Create");

    // Act
    fireEvent.change(screen.getByLabelText(/caption/i), { target: { value: 'Test Caption Successful' } });
    fireEvent.submit(screen.getByRole('button', { name: /create post/i }));

    // Assert
    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled();
    });
    expect(mockToast).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // Basic test to ensure update navigates correctly (not the primary focus of the subtask but good to have)
  it('should navigate to post details on successful update', async () => {
    const mockPost = {
      $id: 'existing-post-id',
      caption: 'Old Caption',
      location: 'Old Location',
      tags: ['tag1', 'tag2'],
      imageId: 'img-id',
      imageUrl: 'url.com/img.png'
    };
    mockUpdatePost.mockResolvedValue({ $id: 'existing-post-id' });
    renderPostForm("Update", mockPost);

    fireEvent.change(screen.getByLabelText(/caption/i), { target: { value: 'Updated Caption' } });
    fireEvent.submit(screen.getByRole('button', { name: /update post/i }));

    await waitFor(() => {
      expect(mockUpdatePost).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith(`/posts/${mockPost.$id}`);
  });
});
