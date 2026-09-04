import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GeneratedAsset } from '../../types';
import { ExploreFeedView } from './ExploreFeedView';

const asset: GeneratedAsset = {
  id: 'asset-existing',
  templateId: 'template-existing',
  templateName: 'Existing appliance template',
  prompt: 'Premium refrigerator in a bright modern kitchen',
  model: 'nano-banana-2',
  imageUrl: '/assets/test-image.png',
  aspectRatio: '16:9',
  creator: {
    name: 'Studio User',
    role: 'Editor',
    email: 'user@example.com',
    avatar: '',
  },
  createdAt: '2026-09-02T00:00:00.000Z',
  timeAgo: 'Just now',
  likes: 0,
  bookmarked: false,
  unitsUsed: 1,
};

describe('ExploreFeedView', () => {
  it('opens the original template through the expected callback contract', () => {
    const onSelectTemplateById = vi.fn();

    render(
      <ExploreFeedView
        assets={[asset]}
        onSelectTemplateById={onSelectTemplateById}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'مشاهده قالب اصلی' }));
    expect(onSelectTemplateById).toHaveBeenCalledOnce();
    expect(onSelectTemplateById).toHaveBeenCalledWith(asset.templateId);
  });
});
