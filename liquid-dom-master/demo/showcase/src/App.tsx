import { type ComponentType, type CSSProperties, useState, useEffect } from 'react'
import { Leva } from 'leva'
import ControlCenterDemo from './demos/ControlCenterDemo'
import IosNotificationDemo from './demos/IosNotificationDemo'
import MenuDemo from './demos/MenuDemo'
import MusicSidebarDemo from './demos/MusicSidebarDemo'
import NotificationCenterDemo from './demos/NotificationCenterDemo'
import R3FIntegrationDemo from './demos/R3FIntegrationDemo'
import VideoControlsDemo from './demos/VideoControlsDemo'
import styles from './App.module.css'

type Showcase = {
  id: string
  label: string
  Component: ComponentType
  sourcePath: string
  frameWidth?: number | string
}

type ShowcaseFrameStyle = CSSProperties & {
  '--showcase-frame-width'?: string
}

const showcases: Showcase[] = [
  {
    id: 'ios-notification',
    label: 'Notification',
    Component: IosNotificationDemo,
    sourcePath: 'demo/showcase/src/demos/IosNotificationDemo.tsx',
  },
  {
    id: 'video-controls',
    label: 'Video Controls',
    Component: VideoControlsDemo,
    sourcePath: 'demo/showcase/src/demos/VideoControlsDemo.tsx',
  },
  {
    id: 'music-sidebar',
    label: 'Music Sidebar',
    Component: MusicSidebarDemo,
    sourcePath: 'demo/showcase/src/demos/MusicSidebarDemo.tsx',
  },
  {
    id: 'control-center',
    label: 'Control Center',
    Component: ControlCenterDemo,
    sourcePath: 'demo/showcase/src/demos/ControlCenterDemo.tsx',
  },
  {
    id: 'menu',
    label: 'Menu',
    Component: MenuDemo,
    sourcePath: 'demo/showcase/src/demos/MenuDemo.tsx',
  },
  {
    id: 'r3f-integration',
    label: 'R3F Integration',
    Component: R3FIntegrationDemo,
    sourcePath: 'demo/showcase/src/demos/R3FIntegrationDemo.tsx',
  },
  {
    id: 'notification-center',
    label: 'Notification Center',
    Component: NotificationCenterDemo,
    sourcePath: 'demo/showcase/src/demos/NotificationCenterDemo.tsx',
    frameWidth: 300,
  },
]

const sourceBaseUrl = 'https://github.com/AndrewPrifer/liquid-dom/blob/master/'

type SupportStatus = 'supported' | 'no-webgpu' | 'no-html-in-canvas' | 'error'

function getInitialSupportStatus(): SupportStatus {
  if (typeof document === 'undefined') {
    return 'supported'
  }

  if (!navigator.gpu) {
    return 'no-webgpu'
  }

  const queuePrototype = (globalThis as { GPUQueue?: { prototype?: object } }).GPUQueue?.prototype
  if (queuePrototype === undefined || !('copyElementImageToTexture' in queuePrototype)) {
    return 'no-html-in-canvas'
  }

  return 'supported'
}

export default function App() {
  const [supportStatus, setSupportStatus] = useState<SupportStatus>(getInitialSupportStatus)

  useEffect(() => {
    const handleUnsupported = () => setSupportStatus('error')
    window.addEventListener('liquid-dom-unsupported-error', handleUnsupported)
    return () => window.removeEventListener('liquid-dom-unsupported-error', handleUnsupported)
  }, [])

  const [selectedShowcaseId, setSelectedShowcaseId] = useState(showcases[0].id)
  const selectedShowcase =
    showcases.find((showcase) => showcase.id === selectedShowcaseId) ?? showcases[0]
  const SelectedShowcase = selectedShowcase.Component
  const showcaseFrameStyle: ShowcaseFrameStyle | undefined = selectedShowcase.frameWidth === undefined
    ? undefined
    : {
      '--showcase-frame-width': typeof selectedShowcase.frameWidth === 'number'
        ? `${selectedShowcase.frameWidth}px`
        : selectedShowcase.frameWidth,
    }

  return (
    <>
      <Leva hidden />
      <main className={styles.root}>
        {supportStatus !== 'supported' ? (
          <section className={styles.unsupportedNote} aria-labelledby="unsupported-title">
            <h1 id="unsupported-title" className={styles.unsupportedTitle}>
              {supportStatus === 'no-webgpu' && 'WebGPU is not supported'}
              {supportStatus === 'no-html-in-canvas' && 'HTML in Canvas is not enabled'}
              {supportStatus === 'error' && 'Renderer Initialization Failed'}
            </h1>
            <p className={styles.unsupportedCopy}>
              {supportStatus === 'no-webgpu' && 'Your browser does not support WebGPU. A compatible browser is required.'}
              {supportStatus === 'no-html-in-canvas' && "Enable Chrome's HTML-in-Canvas flag, then reload this page."}
              {supportStatus === 'error' && "An error occurred while rendering. Ensure the HTML-in-Canvas flag is fully enabled."}
            </p>
            {supportStatus !== 'no-webgpu' && (
              <code className={styles.unsupportedFlag}>chrome://flags/#canvas-draw-element</code>
            )}
          </section>
        ) : (
          <>
            <nav
              aria-label="Showcases"
              className={styles.tabBar}
            >
              {showcases.map((showcase) => (
                <button
                  key={showcase.id}
                  className={[
                    styles.tabButton,
                    showcase.id === selectedShowcase.id ? styles.tabButtonActive : '',
                  ].join(' ')}
                  type="button"
                  aria-pressed={showcase.id === selectedShowcase.id}
                  onClick={() => setSelectedShowcaseId(showcase.id)}
                >
                  {showcase.label}
                </button>
              ))}
            </nav>

            <label className={styles.mobilePicker}>
              <span className={styles.mobilePickerLabel}>Showcase</span>
              <select
                className={styles.mobileSelect}
                value={selectedShowcase.id}
                onChange={(event) => setSelectedShowcaseId(event.target.value)}
              >
                {showcases.map((showcase) => (
                  <option key={showcase.id} value={showcase.id}>
                    {showcase.label}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.stage}>
              <section className={styles.showcaseFrame} style={showcaseFrameStyle}>
                <SelectedShowcase key={selectedShowcase.id} />
              </section>
              <p className={styles.sourceCaption}>
                <a
                  href={`${sourceBaseUrl}${selectedShowcase.sourcePath}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View source on GitHub
                </a>
              </p>
            </div>
          </>
        )}
        <footer className={styles.footer}>
          <p>
            Made with ❤️ by{' '}
            <a href="https://x.com/AndrewPrifer" target="_blank" rel="noreferrer">
              Andrew Prifer
            </a>
          </p>
          <p>
            Check out the source code and the Liquid DOM library on{' '}
            <a href="https://github.com/AndrewPrifer/liquid-dom" target="_blank" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
        </footer>
      </main>
    </>
  )
}
