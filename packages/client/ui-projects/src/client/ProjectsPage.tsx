/**
 * The Projects page in the main area: the sidebar's Projects entry opens it,
 * and it hosts the same per-workspace editor as the Settings section.
 */
import { ProjectsSection, type ProjectsSectionComponentProps } from './ProjectsSection.tsx'
import css from './ProjectsPage.module.css'

/** The page reads the same props as the Settings section, without its title switch. */
export type ProjectsPageProps = Omit<ProjectsSectionComponentProps, 'hideTitle'>

/**
 * Render the Projects page.
 * @param props - workspace hook, locale seat, and the projects form.
 * @returns the scrolling page with its heading and the project editor.
 */
export function ProjectsPage(props: ProjectsPageProps) {
  return (
    <div className={css.page}>
      <div className={css.scroll}>
        <div className={css.content}>
          <h1 className={css.heading}>{props.t('title')}</h1>
          <ProjectsSection {...props} hideTitle />
        </div>
      </div>
    </div>
  )
}
