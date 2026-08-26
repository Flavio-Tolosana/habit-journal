<script lang="ts">
	import { page } from '$app/stores';

	const tabs = [
		{ href: '/', label: 'Hoy', icon: '📅' },
		{ href: '/month', label: 'Calendario', icon: '📆' },
		{ href: '/charts', label: 'Gráficas', icon: '📊' },
		{ href: '/settings', label: 'Ajustes', icon: '⚙️' }
	] as const;

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<nav class="nav" aria-label="Navegación principal">
	{#each tabs as tab}
		<a
			href={tab.href}
			class="nav-tab"
			class:active={isActive(tab.href, $page.url.pathname)}
			aria-label={tab.label}
			aria-current={isActive(tab.href, $page.url.pathname) ? 'page' : undefined}
		>
			<span class="nav-icon" aria-hidden="true">{tab.icon}</span>
			<span class="nav-label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		height: var(--nav-height);
		background: var(--color-background);
		border-top: 1px solid var(--color-border);
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
		z-index: 100;
		padding-bottom: env(safe-area-inset-bottom, 0);
	}

	.nav-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color 0.15s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.nav-tab:hover {
		color: var(--color-primary);
	}

	.nav-tab.active {
		color: var(--color-primary);
		font-weight: 500;
	}

	.nav-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.nav-label {
		font-size: 0.625rem;
		line-height: 1;
	}

	@media (min-width: 640px) {
		.nav {
			max-width: 100%;
		}

		.nav-label {
			font-size: 0.75rem;
		}
	}
</style>
