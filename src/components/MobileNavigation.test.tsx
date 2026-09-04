import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileNavigation } from './MobileNavigation';

describe('MobileNavigation', () => {
  it('traps focus in More and restores focus when dismissed with Escape', async () => {
    render(
      <MobileNavigation
        currentView="workspace"
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
        isAdmin
      />,
    );

    const moreButton = screen.getByRole('button', { name: 'بیشتر' });
    moreButton.focus();
    fireEvent.click(moreButton);

    const closeButton = screen.getByRole('button', { name: 'بستن منوی بیشتر' });
    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'خروج' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'گزینه‌های بیشتر' })).not.toBeInTheDocument());
    expect(moreButton).toHaveFocus();
  });
});
