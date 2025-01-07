import React, { useRef, useState } from 'react';
import { Animation } from '../../components/Animation';
import { Section } from '../../components/Section';
import { ArticleCard, ArticleCardSkeleton } from '../../components/ArticleCard';
import * as classes from './style.module.css';

// GitHub API Fetch function (supports pagination)
async function fetchGitHubData(): Promise<any[]> {
    const token = "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";
    const username = "paithoa";
    const repoList: any[] = [];
    let page = 1;
    let isLastPage = false;

    // Fetch all pages of repos from GitHub API
    while (!isLastPage) {
        const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}`, {
            headers: {
                Authorization: `Bearer ${token}`, // Send the token as the Authorization header
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data from GitHub');
        }

        const repos = await response.json();

        // Push fetched repositories to the repoList
        repoList.push(...repos);

        // Check if it's the last page
        isLastPage = repos.length < 100;
        page++;
    }

    return repoList;
}

interface ArticlesSectionProps {}

export function ArticlesSection(): React.ReactElement {
    const [articles, setArticles] = React.useState<ArticleCard[]>([]);
    const [loading, setLoading] = React.useState(true);

    const sliderRef = useRef<HTMLDivElement | null>(null);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    async function collectArticlesFromGitHub(): Promise<ArticleCard[]> {
        const githubData = await fetchGitHubData();

        return githubData
            .map((repo) => ({
                category: repo.language || 'No Language',
                title: repo.name,
                publishedAt: new Date(repo.created_at),
                link: repo.html_url,
                description: repo.description || 'No description available',
            }))
            .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()); // Sort in descending order by publishedAt
    }

    React.useEffect(() => {
        (async function () {
            try {
                const fetchedArticles = await collectArticlesFromGitHub();
                setArticles(fetchedArticles);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Handle mouse down event
    const handleMouseDown = (e: React.MouseEvent) => {
        if (sliderRef.current) {
            setIsMouseDown(true);
            setStartX(e.clientX);
            setScrollLeft(sliderRef.current.scrollLeft);
        }
    };

    // Handle mouse leave event
    const handleMouseLeave = () => {
        setIsMouseDown(false);
    };

    // Handle mouse up event
    const handleMouseUp = () => {
        setIsMouseDown(false);
    };

    // Handle mouse move event to simulate dragging
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMouseDown || !sliderRef.current) return;

        const distance = e.clientX - startX;
        sliderRef.current.scrollLeft = scrollLeft - distance;
    };

    return (
        <Animation type="fadeUp" delay={1000}>
            <Section anchor="articles" heading="Latest GitHub Repositories">
                <div
                    ref={sliderRef}
                    className={classes.ArticlesSlider}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{ cursor: isMouseDown ? 'grabbing' : 'grab' }}
                >
                    {loading
                        ? [...Array(3)].map((_, key) => <ArticleCardSkeleton key={key} />)
                        : articles.length > 0
                        ? articles.map((article, key) => (
                              <ArticleCard key={key} data={article} />
                          ))
                        : <p>No repositories found.</p>}
                </div>
            </Section>
        </Animation>
    );
}
